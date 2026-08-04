"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  FUNDING,
} from "@paypal/react-paypal-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getBalance,
  getPayPalConfig,
  getUsage,
  createPayPalOrder,
  capturePayPalOrder,
  UsageEvent,
} from "@/lib/billingApi";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DaySummary {
  date: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  costUsd: number;
}

function groupByDay(events: UsageEvent[]): DaySummary[] {
  const map = new Map<string, DaySummary>();
  for (const e of events) {
    const date = e.created_at.slice(0, 10);
    const d = map.get(date) ?? {
      date,
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheTokens: 0,
      costUsd: 0,
    };
    map.set(date, {
      date,
      requests: d.requests + 1,
      inputTokens: d.inputTokens + e.input_tokens,
      outputTokens: d.outputTokens + e.output_tokens,
      cacheTokens: d.cacheTokens + e.cache_read_tokens,
      costUsd: d.costUsd + e.cost_usd,
    });
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function fmtUsd(n: number, decimals = 4): string {
  return `$${n.toFixed(decimals)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deploymentUrl: string;
}

export function BillingDialog({
  open,
  onOpenChange,
  deploymentUrl,
}: BillingDialogProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  // Balance
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Usage
  const [days, setDays] = useState<DaySummary[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  // Top-up
  const [topupAmount, setTopupAmount] = useState("");
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);

  const parsedAmount = parseFloat(topupAmount);
  const validAmount = !isNaN(parsedAmount) && parsedAmount >= 1;

  const fetchBalance = async () => {
    if (!token || !deploymentUrl) return;
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const data = await getBalance(deploymentUrl, token);
      setBalance(data.balance_usd);
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : "Failed to load balance");
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchUsage = async () => {
    if (!token || !deploymentUrl) return;
    setUsageLoading(true);
    setUsageError(null);
    try {
      const data = await getUsage(deploymentUrl, token);
      setDays(groupByDay(data.usage));
    } catch (e) {
      setUsageError(e instanceof Error ? e.message : "Failed to load usage");
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchBalance();
    fetchUsage();
    getPayPalConfig(deploymentUrl)
      .then((cfg) => setPaypalClientId(cfg.client_id || null))
      .catch(() => setPaypalClientId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token, deploymentUrl]);

  const handleApprove = async (data: { orderID: string }) => {
    try {
      const result = await capturePayPalOrder(deploymentUrl, token, data.orderID);
      setBalance(result.balance_usd);
      setTopupAmount("");
      setTopupSuccess(
        `$${result.captured_usd.toFixed(2)} added. New balance: ${fmtUsd(result.balance_usd)}`
      );
    } catch {
      setTopupError(
        "Payment received but balance update failed. Contact support."
      );
    }
  };

  const totalCost = days.reduce((s, d) => s + d.costUsd, 0);
  const lowBalance = balance !== null && balance < 1.0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Usage &amp; Billing</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="balance" className="flex-1">
              Balance
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex-1">
              Usage by Day
            </TabsTrigger>
          </TabsList>

          {/* ── Balance ─────────────────────────────────── */}
          <TabsContent value="balance" className="space-y-4 pt-3">
            <div className="rounded-lg border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current Balance
              </p>
              {balanceLoading ? (
                <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
              ) : balanceError ? (
                <p className="mt-2 text-sm text-destructive">{balanceError}</p>
              ) : balance !== null ? (
                <div className="mt-1 flex items-baseline gap-3">
                  <span
                    className={`text-4xl font-bold tabular-nums ${
                      lowBalance ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {fmtUsd(balance)}
                  </span>
                  {lowBalance && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Low balance
                    </span>
                  )}
                </div>
              ) : null}
              <button
                onClick={fetchBalance}
                className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium">Top Up via PayPal / Credit Card</p>
              <div className="grid gap-1.5">
                <Label htmlFor="topup-amount">Amount (USD, minimum $1)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="topup-amount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    className="pl-7"
                    value={topupAmount}
                    onChange={(e) => {
                      setTopupAmount(e.target.value);
                      setTopupError(null);
                      setTopupSuccess(null);
                    }}
                  />
                </div>
              </div>

              {topupError && (
                <p className="text-sm text-destructive">{topupError}</p>
              )}
              {topupSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {topupSuccess}
                </p>
              )}

              {validAmount && paypalClientId ? (
                <PayPalScriptProvider
                  options={{ clientId: paypalClientId, currency: "USD" }}
                >
                  <div className="space-y-2">
                    <PayPalButtons
                      fundingSource={FUNDING.PAYPAL}
                      style={{ layout: "horizontal", height: 40, tagline: false }}
                      createOrder={async () => {
                        const { order_id } = await createPayPalOrder(
                          deploymentUrl,
                          token,
                          parsedAmount
                        );
                        return order_id;
                      }}
                      onApprove={handleApprove}
                      onError={() =>
                        setTopupError("Payment failed. Please try again.")
                      }
                      onCancel={() => setTopupError("Payment cancelled.")}
                    />
                    <PayPalButtons
                      fundingSource={FUNDING.CARD}
                      style={{ layout: "vertical", height: 40 }}
                      createOrder={async () => {
                        const { order_id } = await createPayPalOrder(
                          deploymentUrl,
                          token,
                          parsedAmount
                        );
                        return order_id;
                      }}
                      onApprove={handleApprove}
                      onError={() =>
                        setTopupError("Payment failed. Please try again.")
                      }
                      onCancel={() => setTopupError("Payment cancelled.")}
                    />
                  </div>
                </PayPalScriptProvider>
              ) : validAmount ? (
                <p className="text-sm text-muted-foreground">
                  Loading PayPal…
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter an amount to continue with PayPal.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── Usage by Day ────────────────────────────── */}
          <TabsContent value="usage" className="pt-3 space-y-3">
            {usageLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : usageError ? (
              <p className="py-4 text-sm text-destructive">{usageError}</p>
            ) : days.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No usage recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Date
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Requests
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Input
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Output
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Cached
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {days.map((d) => (
                      <tr key={d.date} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{d.date}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {d.requests}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {fmtTokens(d.inputTokens)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {fmtTokens(d.outputTokens)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {fmtTokens(d.cacheTokens)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {fmtUsd(d.costUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50 font-medium">
                      <td
                        className="px-3 py-2 text-sm text-muted-foreground"
                        colSpan={5}
                      >
                        Total — {days.length} day
                        {days.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {fmtUsd(totalCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <button
              onClick={fetchUsage}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
