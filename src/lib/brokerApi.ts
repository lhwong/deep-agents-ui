/**
 * Client for the alpha-team broker credential API endpoints.
 * All calls require a Bearer token (Google id_token from NextAuth session).
 */

export interface TigerCredentials {
  tiger_id: string;
  private_key: string;
  account: string;
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
): Promise<{ configured: boolean }> {
  const res = await apiFetch(deploymentUrl, token, "/credentials/tiger/status");
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}

export async function saveBrokerCredentials(
  deploymentUrl: string,
  token: string,
  creds: TigerCredentials,
): Promise<void> {
  const res = await apiFetch(deploymentUrl, token, "/credentials/tiger", {
    method: "POST",
    body: JSON.stringify(creds),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Save failed: ${text}`);
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
