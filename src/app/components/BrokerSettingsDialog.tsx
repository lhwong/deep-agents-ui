"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  deleteBrokerCredentials,
  exchangeTigerOAuth2Code,
  getBrokerStatus,
  getTigerOAuth2Config,
  type BrokerAuthMethod,
} from "@/lib/brokerApi";

interface BrokerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deploymentUrl: string;
}

async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return { verifier, challenge };
}

export function BrokerSettingsDialog({
  open,
  onOpenChange,
  deploymentUrl,
}: BrokerSettingsDialogProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [authMethod, setAuthMethod] = useState<BrokerAuthMethod>(null);
  const [connecting, setConnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // PKCE state kept across the popup round-trip
  const pkceRef = useRef<{ verifier: string; state: string } | null>(null);

  useEffect(() => {
    if (!open || !token || !deploymentUrl) return;
    setError(null);
    setSuccess(null);
    getBrokerStatus(deploymentUrl, token)
      .then((s) => {
        setConfigured(s.configured);
        setAuthMethod(s.auth_method ?? null);
      })
      .catch(() => {
        setConfigured(false);
        setAuthMethod(null);
      });
  }, [open, token, deploymentUrl]);

  // Listen for the OAuth2 callback from the popup.
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.type !== "tiger_oauth2_callback"
      )
        return;

      const { code, state, error: cbError } = event.data as {
        code?: string;
        state?: string;
        error?: string;
      };

      if (cbError) {
        setConnecting(false);
        setError(`Tiger authorization denied: ${cbError}`);
        return;
      }

      const saved = pkceRef.current;
      if (!saved || state !== saved.state) {
        setConnecting(false);
        setError("State mismatch — possible CSRF. Please try again.");
        return;
      }
      if (!code) {
        setConnecting(false);
        setError("No authorization code received.");
        return;
      }

      const redirectUri = `${window.location.origin}/tiger-callback`;
      try {
        await exchangeTigerOAuth2Code(deploymentUrl, token, {
          code,
          code_verifier: saved.verifier,
          redirect_uri: redirectUri,
          state,
        });
        setConfigured(true);
        setAuthMethod("oauth2");
        setSuccess("Tiger account connected successfully.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection failed.");
      } finally {
        setConnecting(false);
        pkceRef.current = null;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [deploymentUrl, token]);

  const handleConnect = async () => {
    setError(null);
    setSuccess(null);
    setConnecting(true);

    try {
      const redirectUri = `${window.location.origin}/tiger-callback`;
      const [config, { verifier, challenge }] = await Promise.all([
        getTigerOAuth2Config(deploymentUrl, redirectUri),
        generatePkce(),
      ]);
      const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      pkceRef.current = { verifier, state };

      const params = new URLSearchParams({
        response_type: "code",
        client_id: config.client_id,
        redirect_uri: redirectUri,
        scope: config.scope,
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      });
      const authUrl = `${config.auth_endpoint}?${params.toString()}`;

      const popup = window.open(authUrl, "tiger_oauth2", "width=520,height=680");
      if (!popup) {
        setConnecting(false);
        setError("Popup blocked. Allow popups for this site and try again.");
        return;
      }
      // If the popup is closed without completing the flow, reset state.
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          setConnecting((prev) => {
            if (prev) setError("Authorization window closed. Please try again.");
            return false;
          });
        }
      }, 500);
    } catch (e) {
      setConnecting(false);
      setError(e instanceof Error ? e.message : "Failed to start authorization.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Disconnect your Tiger broker account?")) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteBrokerCredentials(deploymentUrl, token);
      setConfigured(false);
      setAuthMethod(null);
      setSuccess("Broker account disconnected.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const authLabel = authMethod === "oauth2" ? "Connected via OAuth2" : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Tiger Broker Account</DialogTitle>
          <DialogDescription>
            {configured === null
              ? "Checking status…"
              : configured
                ? authLabel
                  ? `${authLabel}. Click "Connect" to re-authorize.`
                  : "Your Tiger credentials are configured."
                : "Connect your Tiger Brokers account to enable live portfolio data."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Primary: OAuth2 connect button */}
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full"
          >
            {connecting
              ? "Waiting for authorization…"
              : configured && authMethod === "oauth2"
                ? "Reconnect Tiger Account"
                : "Connect Tiger Account"}
          </Button>

        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {configured && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="sm:mr-auto"
            >
              {deleting ? "Disconnecting…" : "Disconnect account"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
