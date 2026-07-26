"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClient } from "@/providers/ClientProvider";
import { useSession } from "next-auth/react";

// ── Preferred tickers ─────────────────────────────────────────────────────────

const DEFAULT_TICKERS = [
  "TSLA", "CRCL", "AMD", "NBIS", "SOFI", "NU",
  "AVGO", "MU", "TSM", "PANW", "ARM", "MRVL", "ORCL",
];
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
    category: "Portfolio",
    templates: [
      {
        label: "Review my portfolio",
        prompt: "Review my portfolio",
      },
      {
        label: "P&L dashboard",
        prompt:
          "Show realized P&L for closed positions and max profit for open positions for each expiration",
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
    category: "Trade Recommendations",
    templates: [
      {
        label: "CSP recommendations",
        prompt:
          "Using the same strategy as the CSP rotation backtest, generate sell put trade recommendations for my current account. Fetch my live account state from Tiger (ELV, cash balance, max buying power, excess liquidity, EL%), open positions and use them as the starting point.\n\nParameters:\n\nTickers: ${tickers_to_trade}\nexcess_liquidity_floor: 0.10\nmax_contracts_per_trade: 1\n\nFor each recommended trade show: Ticker, Expiry, Strike, Contracts, Margin Required, Premium, Annualised Yield, BP After Trade, EL After Trade, EL%.",
      },
      {
        label: "GEX analysis",
        prompt:
          "Run a GEX analysis for TSLA for the nearest 3 expiries. Identify the gamma flip level, max pain strike, put wall, and call wall.",
      },
    ],
  },
  {
    category: "Backtest",
    templates: [
      {
        label: "CSP rotation backtest",
        prompt:
          "Run a CSP rotation backtest from 2025-01-01 to today on tickers ${tickers_to_trade} with ELV $100,000, target DTE 30, close at 50% profit, EL floor 10%, max 1 contract per trade.",
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
