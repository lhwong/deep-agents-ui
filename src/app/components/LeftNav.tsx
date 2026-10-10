"use client";

import { useState, type ReactNode } from "react";
import { useQueryState } from "nuqs";
import {
  PanelLeft,
  SquarePen,
  Building2,
  Wallet,
  Settings,
  LogOut,
  AlertCircle,
  X,
} from "lucide-react";

// ── Alpha logomark ────────────────────────────────────────────────────────────
// Geometric α: 300° circle arc (center 9,11 r5.8) + descending tail
function AlphaMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M14 8.1 A5.8 5.8 0 1 0 14 13.9 L17 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
import { cn } from "@/lib/utils";
import { ThreadList } from "./ThreadList";
import { signOut } from "../actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STORAGE_KEY = "left-nav-expanded";

// ── NavItem ───────────────────────────────────────────────────────────────────

interface NavItemProps {
  icon: ReactNode;
  label: string;
  expanded: boolean;
  badge?: number;
  onClick?: () => void;
  className?: string;
}

function NavItem({ icon, label, expanded, badge, onClick, className }: NavItemProps) {
  const inner = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium",
        "text-foreground/80 hover:bg-accent hover:text-foreground",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        expanded ? "gap-3 justify-start" : "justify-center",
        className,
      )}
      aria-label={label}
    >
      <span className="relative shrink-0">
        {icon}
        {!!badge && badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground leading-none">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {expanded && <span className="truncate">{label}</span>}
    </button>
  );

  if (expanded) return inner;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ── LeftNav ───────────────────────────────────────────────────────────────────

interface LeftNavProps {
  onNewThread: () => void;
  onBroker: () => void;
  onCredits: () => void;
  onSettings: () => void;
  onMutateReady: (fn: () => void) => void;
  streamError?: Error | null;
  onClearError?: () => void;
}

export function LeftNav({
  onNewThread,
  onBroker,
  onCredits,
  onSettings,
  onMutateReady,
  streamError,
  onClearError,
}: LeftNavProps) {
  const [errorOpen, setErrorOpen] = useState(false);
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? (JSON.parse(saved) as boolean) : true;
    } catch {
      return true;
    }
  });
  const [interruptCount, setInterruptCount] = useState(0);
  const [, setThreadId] = useQueryState("threadId");

  const toggle = () =>
    setExpanded((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        className={cn(
          "relative flex h-full shrink-0 flex-col border-r border-border bg-sidebar",
          "transition-[width] duration-200 ease-in-out overflow-hidden",
          expanded ? "w-[80vw] sm:w-[280px]" : "w-[40px] sm:w-[52px]",
        )}
      >
        {/* ── Logo / Toggle header ── */}
        <div className="flex h-14 shrink-0 items-center px-3">
          {expanded ? (
            <>
              <div className="flex items-center gap-2.5 text-[#2F6868]">
                <AlphaMark size={22} />
                <span className="text-sm font-bold tracking-widest uppercase text-foreground select-none">
                  Alpha
                </span>
              </div>
              <button
                type="button"
                onClick={toggle}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Collapse menu"
              >
                <PanelLeft size={18} />
              </button>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggle}
                  className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[#2F6868] hover:bg-accent transition-colors"
                  aria-label="Expand menu"
                >
                  <AlphaMark size={22} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Alpha</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── New chat ── */}
        <div className="shrink-0 px-2">
          <NavItem
            icon={<SquarePen size={18} />}
            label="New thread"
            expanded={expanded}
            onClick={onNewThread}
          />
        </div>

        {/* ── Thread list (expanded only) ── */}
        <div className="relative min-h-0 flex-1">
          {expanded && (
            <ThreadList
              onThreadSelect={(id) => {
                void setThreadId(id);
                setExpanded(false);
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(false)); } catch {}
              }}
              onMutateReady={onMutateReady}
              onInterruptCountChange={setInterruptCount}
            />
          )}
        </div>

        {/* ── Bottom items ── */}
        <div className="shrink-0 border-t border-border px-2 pb-3 pt-2">
          <div className="flex flex-col gap-0.5">
            {/* Error indicator — always visible; red when an error occurred */}
            <div className="relative">
              <button
                type="button"
                onClick={() => streamError && setErrorOpen((v) => !v)}
                aria-pressed={errorOpen}
                className={cn(
                  "flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  expanded ? "gap-3 justify-start" : "justify-center",
                  streamError
                    ? "text-destructive hover:bg-destructive/10 cursor-pointer"
                    : "text-muted-foreground/40 cursor-default"
                )}
                aria-label={streamError ? "Show last error" : "No errors"}
              >
                <AlertCircle size={18} className="shrink-0" />
                {expanded && <span className="truncate">{streamError ? "Last error" : "No errors"}</span>}
              </button>
              {streamError && errorOpen && (
                <div className={cn(
                  "absolute z-50 w-72 rounded-lg border border-border bg-popover p-3 shadow-lg",
                  expanded ? "bottom-full left-0 mb-2" : "bottom-0 left-full ml-2"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-destructive">Last error</p>
                    <button
                      type="button"
                      onClick={() => { setErrorOpen(false); onClearError?.(); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground break-words whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {(() => {
                      const parts: string[] = [];
                      if (streamError.name && streamError.name !== "Error" && streamError.name !== "StreamError") {
                        parts.push(`[${streamError.name}]`);
                      }
                      parts.push(streamError.message);
                      const status = (streamError as unknown as Record<string, unknown>).status;
                      if (status != null) parts.push(`HTTP status: ${status}`);
                      if (streamError.cause) parts.push(`Cause: ${String(streamError.cause)}`);
                      return parts.join("\n");
                    })()}
                  </p>
                </div>
              )}
            </div>
            <NavItem
              icon={<Building2 size={18} />}
              label="Broker"
              expanded={expanded}
              onClick={onBroker}
            />
            <NavItem
              icon={<Wallet size={18} />}
              label="Credits"
              expanded={expanded}
              onClick={onCredits}
            />
            <NavItem
              icon={<Settings size={18} />}
              label="Settings"
              expanded={expanded}
              onClick={onSettings}
            />
            <form action={signOut} className="w-full">
              <button
                type="submit"
                className={cn(
                  "flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium",
                  "text-foreground/80 hover:bg-accent hover:text-foreground",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  expanded ? "gap-3 justify-start" : "justify-center",
                )}
                aria-label="Sign out"
              >
                <LogOut size={18} className="shrink-0" />
                {expanded && <span className="truncate">Sign out</span>}
              </button>
            </form>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
