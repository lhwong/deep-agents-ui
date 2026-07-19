"use client";

import { createContext, useContext, useMemo, useEffect, useRef, ReactNode } from "react";
import { Client } from "@langchain/langgraph-sdk";
import { useSession } from "next-auth/react";

interface ClientContextValue {
  client: Client;
}

const ClientContext = createContext<ClientContextValue | null>(null);

interface ClientProviderProps {
  children: ReactNode;
  deploymentUrl: string;
  apiKey: string;
}

export function ClientProvider({
  children,
  deploymentUrl,
  apiKey,
}: ClientProviderProps) {
  const { data: session } = useSession();

  // headersRef points to the same plain-object that the Client stores internally
  // as `this.defaultHeaders`. Mutating it updates the headers on every subsequent
  // request without recreating the Client instance.
  const headersRef = useRef<Record<string, string>>({});

  // Create a new Client only when the deployment URL or API key changes (i.e.
  // user updates the config). Token refreshes (silent re-auth with prompt=none)
  // must NOT recreate the client — that would cause useStream to re-initialize,
  // attempt to reconnect to any pending thread run, and fire APIConnectionError.
  const client = useMemo(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
      "X-Provider": session?.provider || "",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    headersRef.current = headers;
    return new Client({ apiUrl: deploymentUrl, defaultHeaders: headers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploymentUrl, apiKey]);

  // On every token/provider change, patch the live headers object in-place.
  // The Client reads `this.defaultHeaders` on every request, so no new Client
  // instance is needed.
  useEffect(() => {
    const headers = headersRef.current;
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    } else {
      delete headers["Authorization"];
    }
    headers["X-Provider"] = session?.provider || "";
  }, [session?.accessToken, session?.provider]);

  const value = useMemo(() => ({ client }), [client]);

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClient(): Client {
  const context = useContext(ClientContext);

  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context.client;
}
