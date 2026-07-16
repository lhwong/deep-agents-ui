"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteBrokerCredentials,
  getBrokerStatus,
  saveBrokerCredentials,
} from "@/lib/brokerApi";

interface BrokerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deploymentUrl: string;
}

export function BrokerSettingsDialog({
  open,
  onOpenChange,
  deploymentUrl,
}: BrokerSettingsDialogProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [tigerId, setTigerId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [account, setAccount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token || !deploymentUrl) return;
    setError(null);
    setSuccess(null);
    getBrokerStatus(deploymentUrl, token)
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
  }, [open, token, deploymentUrl]);

  const handleSave = async () => {
    if (!tigerId.trim() || !privateKey.trim() || !account.trim()) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await saveBrokerCredentials(deploymentUrl, token, {
        tiger_id: tigerId.trim(),
        private_key: privateKey.trim(),
        account: account.trim(),
      });
      setConfigured(true);
      setSuccess("Credentials saved successfully.");
      setTigerId("");
      setPrivateKey("");
      setAccount("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove your Tiger broker credentials?")) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteBrokerCredentials(deploymentUrl, token);
      setConfigured(false);
      setSuccess("Credentials removed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Tiger Broker Account</DialogTitle>
          <DialogDescription>
            {configured === null
              ? "Checking status…"
              : configured
                ? "Your Tiger credentials are configured. Enter new values below to update them."
                : "Enter your Tiger credentials to connect your broker account."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="tiger-id">Tiger ID</Label>
            <Input
              id="tiger-id"
              placeholder="e.g. 20157065"
              value={tigerId}
              onChange={(e) => setTigerId(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="account">Account Number</Label>
            <Input
              id="account"
              placeholder="e.g. 50827216"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="private-key">
              Private Key{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (PKCS#1 or PKCS#8)
              </span>
            </Label>
            <textarea
              id="private-key"
              rows={5}
              placeholder="MIICXAIBAAKBg..."
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
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
              {deleting ? "Removing…" : "Remove credentials"}
            </Button>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
