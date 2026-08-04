/**
 * Client for the alpha-team billing API endpoints.
 */

export interface UsageEvent {
  run_id: string | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cost_usd: number;
  created_at: string;
}

export interface BalanceResponse {
  identity: string;
  balance_usd: number;
}

export interface UsageResponse {
  identity: string;
  usage: UsageEvent[];
}

async function apiFetch(
  deploymentUrl: string,
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${deploymentUrl.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

export async function getBalance(
  deploymentUrl: string,
  token: string,
): Promise<BalanceResponse> {
  const res = await apiFetch(deploymentUrl, token, "/billing/balance");
  if (!res.ok) throw new Error(`Balance fetch failed: ${res.status}`);
  return res.json();
}

export async function getUsage(
  deploymentUrl: string,
  token: string,
  limit = 200,
): Promise<UsageResponse> {
  const res = await apiFetch(deploymentUrl, token, `/billing/usage?limit=${limit}`);
  if (!res.ok) throw new Error(`Usage fetch failed: ${res.status}`);
  return res.json();
}

export interface PayPalCaptureResponse {
  balance_usd: number;
  captured_usd: number;
}

export async function getPayPalConfig(
  deploymentUrl: string,
): Promise<{ client_id: string }> {
  const res = await fetch(`${deploymentUrl.replace(/\/$/, "")}/billing/paypal/config`);
  if (!res.ok) throw new Error(`PayPal config fetch failed: ${res.status}`);
  return res.json();
}

export async function createPayPalOrder(
  deploymentUrl: string,
  token: string,
  amountUsd: number,
): Promise<{ order_id: string }> {
  const res = await apiFetch(deploymentUrl, token, "/billing/paypal/create-order", {
    method: "POST",
    body: JSON.stringify({ amount_usd: amountUsd }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Create order failed: ${res.status}`);
  }
  return res.json();
}

export async function capturePayPalOrder(
  deploymentUrl: string,
  token: string,
  orderId: string,
): Promise<PayPalCaptureResponse> {
  const res = await apiFetch(deploymentUrl, token, "/billing/paypal/capture-order", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Capture failed: ${res.status}`);
  }
  return res.json();
}
