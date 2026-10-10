/**
 * Client for the alpha-team broker credential API endpoints.
 * All calls require a Bearer token (Google id_token from NextAuth session).
 */

export interface TigerOAuth2Config {
  client_id: string;
  auth_endpoint: string;
  scope: string;
}

export type BrokerAuthMethod = "oauth2" | null;

export interface BrokerStatusResult {
  configured: boolean;
  auth_method: BrokerAuthMethod;
}

async function apiFetch(
  deploymentUrl: string,
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${deploymentUrl.replace(/\/$/, "")}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

export async function getBrokerStatus(
  deploymentUrl: string,
  token: string,
): Promise<BrokerStatusResult> {
  const res = await apiFetch(deploymentUrl, token, "/credentials/tiger/status");
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}

export async function getTigerOAuth2Config(
  deploymentUrl: string,
  redirectUri: string,
): Promise<TigerOAuth2Config> {
  const url = `${deploymentUrl.replace(/\/$/, "")}/credentials/tiger/oauth2/config?redirect_uri=${encodeURIComponent(redirectUri)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OAuth2 config failed: ${res.status}`);
  return res.json();
}

export async function exchangeTigerOAuth2Code(
  deploymentUrl: string,
  token: string,
  params: { code: string; code_verifier: string; redirect_uri: string; state: string },
): Promise<void> {
  const res = await apiFetch(deploymentUrl, token, "/credentials/tiger/oauth2/exchange", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`OAuth2 exchange failed: ${text}`);
  }
}

export async function deleteBrokerCredentials(
  deploymentUrl: string,
  token: string,
): Promise<void> {
  const res = await apiFetch(deploymentUrl, token, "/credentials/tiger", {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}
