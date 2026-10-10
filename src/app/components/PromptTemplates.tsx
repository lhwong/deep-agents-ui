"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClient } from "@/providers/ClientProvider";
import { useSession } from "next-auth/react";

// ── Preferred tickers ─────────────────────────────────────────────────────────

const DEFAULT_TICKERS = ["NBIS", "AMD", "CRCL", "SOFI", "NU"];
const PREF_KEY = "tickers_to_trade";

function usePreferredTickers() {
  const client = useClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);

  // Load from LangGraph store when the user ID is available
  useEffect(() => {
    if (!userId) return;
    client.store
      .getItem([userId, "preferences"], PREF_KEY)
      .then((item) => {
        const stored = (item?.value as { tickers?: string[] })?.tickers;
        if (Array.isArray(stored) && stored.length > 0) setTickers(stored);
      })
      .catch(() => {/* silently keep defaults */});
  }, [client, userId]);

  const save = (next: string[]) => {
    setTickers(next);
    if (!userId) return;
    client.store
      .putItem([userId, "preferences"], PREF_KEY, { tickers: next })
      .catch(console.error);
  };

  const add = (raw: string) => {
    const incoming = raw
      .split(/[\s,]+/)
      .map((s) => s.toUpperCase().trim())
      .filter(Boolean);
    save([...new Set([...tickers, ...incoming])]);
  };

  const remove = (ticker: string) => save(tickers.filter((t) => t !== ticker));

  return { tickers, add, remove };
}

// ── Template definitions ──────────────────────────────────────────────────────

export interface PromptTemplate {
  label: string;
  prompt: string;
}

export interface TemplateCategory {
  category: string;
  templates: PromptTemplate[];
}

// Use ${tickers_to_trade} in any prompt — substituted at click time
// with the user's saved ticker list from their LangGraph preferences.
export const PROMPT_TEMPLATES: TemplateCategory[] = [
  {
    category: "Backtest",
    templates: [
      {
        label: "CSP rotation backtest",
        prompt:
          "Run a CSP rotation backtest from 2026-01-01 to today on tickers ${tickers_to_trade} with total cash $10,000, target DTE 30, close at 50% profit, EL floor 25%, max 1 contract per trade.",
      },
      {
        label: "PCS rotation backtest",
        prompt:
          "Run a put credit spread rotation backtest from 2026-01-01 to today on tickers ${tickers_to_trade} with total cash $10,000,  close at 50% profit, EL floor 25%, max 1 contract per trade.",
      },
    ],
  },
  {
    category: "Portfolio",
    templates: [
      {
        label: "Review my portfolio",
        prompt: "Review my portfolio",
      },
      {
        label: "P&L dashboard",
        prompt:
          "Show YTD realized P&L for closed positions and max profit for open positions for each expiration. Show charts and tables of realized P&L and max profit for each expiration.",
      },
      {
        label: "Realized P&L YTD",
        prompt: "Compute my realized P&L for all closed positions year to date",
      },
      {
        label: "Excess liquidity & margin",
        prompt:
          "What is my current excess liquidity, available funds, and margin usage? Am I close to a margin call?",
      },
    ],
  },
  {
    category: "Analysis",
    templates: [
      {
        label: "Expected move strikes",
        prompt:
          "Based on the expected move, list strike price for next 14 expirations of AMD. Show Expiry, DTE, Exp. IV, Exp. Move ($), Target Strike, Listed Strike, Premium, APY, % OTM.",
      },
      {
        label: "Naked put vs spread",
        prompt:
          "For ${tickers_to_trade}, compare Naked Short Put vs Bull Put Credit Spread using the expected-move strike for the nearest 30–45 DTE expiry.\n\nShow:\n1. Volatility context: ATM IV, IV Rank, IV Percentile, HV20, Vol Edge (IV/HV ratio), IV−HV Premium\n2. Structure comparison (5-wide and 10-wide spreads): Short Strike, Long Strike, Net Premium, Max Profit, Max Loss, BPR (Buying Power Reduction), Capital Efficiency, APY \n3. Comparison with 5-wide spread with expected move strike selection without cushion",
      },
    ],
  },
  {
    category: "Trade Recommendations",
    templates: [
      {
        label: "CSP recommendations",
        prompt:
          "Using the same strategy as the CSP rotation backtest, generate sell put trade recommendations for my current account. Fetch my live account state from Tiger (ELV, cash balance, max buying power, excess liquidity, EL%), open positions and use them as the starting point.\n\nParameters:\n\nTickers: ${tickers_to_trade}\nexcess_liquidity_floor: 0.25\nmax_contracts_per_trade: 1\n\nFirst, show all candidates (all tickers × all expirations within 30-45 DTE) as a table: Ticker, Expiry, DTE, Strike, Margin Required, Premium, Annualised Yield. Order by Annualised Yield.\n\nThen, show recommendations: Ticker, Expiry, Strike, Contracts, Margin Required, Premium, Annualised Yield, BP After Trade, EL After Trade, EL%.",
      },
      {
        label: "GEX analysis",
        prompt:
          "Run a GEX analysis for TSLA for the nearest 3 expiries. Identify the gamma flip level, max pain strike, put wall, and call wall.",
      },
    ],
  },
  {
    category: "Strategy",
    templates: [
      {
        label: "Setup + recommend + vet",
        prompt:
          "Set up a CSP strategy:\n- Tickers: ${tickers_to_trade}\n- Total asset: $50,000\n- DTE window: 30–45 days\n- IV Rank min: 40\n- Profit target: 50%\n- Max 1 contract per trade\n\nThen fetch my live account, generate sell-put recommendations, and run the full go/no-go vetting with risk sizing on each candidate.",
      },
      {
        label: "Setup strategy only",
        prompt:
          "Set up a CSP strategy on ${tickers_to_trade}.\nTotal asset $50,000. Profit target 50%, max 1 contract per trade.",
      },
      {
        label: "Recommend + vet (saved strategy)",
        prompt:
          "Give me trade recommendations using my saved strategy and run go/no-go vetting.",
      },
      {
        label: "Backtest saved strategy",
        prompt:
          "Backtest my saved strategy from 2026-01-01 to today.",
      },
      {
        label: "Setup + backtest",
        prompt:
          "Set up a CSP strategy:\n- Tickers: ${tickers_to_trade}\n- Total asset: $50,000\n- DTE window: 30–45 days\n- Profit target: 50%\n- Max 1 contract per trade\n\nThen backtest it from 2026-01-01 to today.",
      },
    ],
  },
];

function resolvePrompt(prompt: string, tickers: string[]): string {
  return prompt.replace(/\$\{tickers_to_trade\}/g, tickers.join(", "));
}

// ── Tickers editor ────────────────────────────────────────────────────────────

function TickersEditor({
  tickers,
  onAdd,
  onRemove,
}: {
  tickers: string[];
  onAdd: (raw: string) => void;
  onRemove: (t: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onAdd(trimmed);
      setDraft("");
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && tickers.length > 0) {
      onRemove(tickers[tickers.length - 1]);
    }
  };

  return (
    <div className="mb-3 rounded-lg border border-border bg-background px-2 py-1.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
        My tickers
      </p>
      <div
        className="flex flex-wrap items-center gap-1"
        onClick={() => inputRef.current?.focus()}
      >
        {tickers.map((t) => (
          <span
            key={t}
            className="flex items-center gap-0.5 rounded-md bg-[#2F6868]/12 px-1.5 py-0.5 text-[11px] font-medium text-[#2F6868]"
          >
            {t}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(t); }}
              className="ml-0.5 rounded hover:text-red-500"
              aria-label={`Remove ${t}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          onKeyDown={handleKey}
          onBlur={commit}
          placeholder={tickers.length === 0 ? "Add tickers…" : "+"}
          className="min-w-[2.5rem] flex-1 bg-transparent text-[11px] text-primary outline-none placeholder:text-tertiary"
        />
      </div>
      <p className="mt-1 text-[10px] text-tertiary">
        Press Enter or comma to add · Backspace to remove last · Saved to your profile
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface PromptTemplatesProps {
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

export function PromptTemplates({ onSelect, onClose }: PromptTemplatesProps) {
  const { tickers, add, remove } = usePreferredTickers();

  return (
    <div className="border-b border-border bg-sidebar px-4 pb-3 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Prompt templates
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-muted-foreground hover:bg-border hover:text-primary"
          aria-label="Close templates"
        >
          <X size={13} />
        </button>
      </div>

      <TickersEditor tickers={tickers} onAdd={add} onRemove={remove} />

      <div className="space-y-3">
        {PROMPT_TEMPLATES.map((group) => (
          <div key={group.category}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
              {group.category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.templates.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  title={resolvePrompt(tpl.prompt, tickers)}
                  onClick={() => {
                    onSelect(resolvePrompt(tpl.prompt, tickers));
                    onClose();
                  }}
                  className={cn(
                    "rounded-full border border-border bg-background px-3 py-1 text-xs text-primary",
                    "transition-colors hover:border-[#2F6868] hover:bg-[#2F6868]/10 hover:text-[#2F6868]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6868]"
                  )}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
