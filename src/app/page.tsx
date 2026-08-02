import Link from "next/link";
import type { ReactNode } from "react";
import {
  Sliders,
  BarChart2,
  Briefcase,
  Sparkles,
  FlaskConical,
  Search,
  TrendingUp,
  Activity,
  Shield,
  ArrowRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { BackendWarmup } from "./login/BackendWarmup";

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-[#2F6868]/50 hover:shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6868]/10 text-[#2F6868]">
        {icon}
      </div>
      <h3 className="mt-5 text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

const ANALYSIS_LAYERS = [
  {
    icon: <Search size={13} />,
    label: "Fundamental",
    desc: "Earnings calendar, analyst sentiment, directional bias",
  },
  {
    icon: <TrendingUp size={13} />,
    label: "Technical",
    desc: "Market regime, support levels, IV-anchored strike",
  },
  {
    icon: <Activity size={13} />,
    label: "Volatility",
    desc: "IV rank, term structure, binary event detection",
  },
  {
    icon: <Shield size={13} />,
    label: "Risk",
    desc: "Contract sizing, EL floor, margin headroom",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackendWarmup />

      {/* ── Navbar ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-bold tracking-tight">Alpha&nbsp;Team</span>
          <Link
            href="/login"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#2F6868] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#265858] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6868]"
          >
            Sign&nbsp;in
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-8 pt-14">
        {/* Radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[640px] w-[800px] rounded-full bg-[#2F6868]/7 blur-3xl" />
        </div>

        <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
          {/* Eyebrow */}
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#2F6868]/30 bg-[#2F6868]/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#2F6868]">
            AI-Powered Options Trading
          </span>

          {/* Headline */}
          <h1 className="text-balance text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Alpha Team
          </h1>
          <p className="mt-3 text-lg font-medium tracking-tight text-[#2F6868] sm:text-xl">
            Trading Intelligence, Engineered for You
          </p>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            An AI assistant that researches, backtests, and recommends options
            trades — vetted across fundamental, technical, volatility, and risk
            analysis before reaching your screen.
          </p>

        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden
          className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground/50"
        >
          <ChevronDown size={22} strokeWidth={1.5} />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-24">
          {/* Section header */}
          <div className="mb-14 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2F6868]">
              Capabilities
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to trade smarter
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              From strategy design to live execution — one assistant handles the
              full workflow.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Customize Strategy */}
            <FeatureCard
              icon={<Sliders size={19} />}
              title="Customize Trading Strategy"
              description="Configure DTE windows, ticker universe, risk limits, profit targets, and margin parameters. The strategy adapts to your account size and trading style."
            />

            {/* Backtesting */}
            <FeatureCard
              icon={<BarChart2 size={19} />}
              title="Backtesting Engine"
              description="Validate Cash Secured Put (CSP) and Put Credit Spread (PCS) rotation strategies against historical options data. Test strike selection, DTE laddering, and exit logic before committing real capital."
            />

            {/* Portfolio Review */}
            <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-[#2F6868]/50 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6868]/10 text-[#2F6868]">
                <Briefcase size={19} />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight">Live Portfolio Review</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Real-time position monitoring with unrealized P&L, margin usage, excess liquidity percentage, and per-expiry breakdown — always know where you stand.
              </p>
              <div className="mt-4">
                <p className="text-[11px] text-muted-foreground">Supported brokers:</p>
                <div className="mt-1.5 flex flex-col gap-1">
                  <a
                    href="https://www.itiger.com/sg/invest/us-options?_sasdk=dMTlhMDI1ODczOTYyYjhkLTA3YWNkODA5OGQzZDJjLTFmNTI1NjMxLTE0ODQ3ODQtMTlhMDI1ODczOTczMGIx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2F6868] hover:underline"
                  >
                    Tiger Brokers
                    <ExternalLink size={10} strokeWidth={2} />
                  </a>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <a
                      href="https://www.interactivebrokers.com/en/trading/products-options.php?menu=B"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      Interactive Brokers
                      <ExternalLink size={10} strokeWidth={2} />
                    </a>
                    <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
                      Coming Soon
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Trade Recommendations — featured, spans 2 cols */}
            <div className="rounded-2xl border border-[#2F6868]/30 bg-[#2F6868]/5 p-6 sm:col-span-2 lg:col-span-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6868]/15 text-[#2F6868]">
                <Sparkles size={19} />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight">Trade Recommendations</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Every recommended entry is independently evaluated by four specialist
                agents running in parallel. You see the consensus — not a single
                signal from a black box.
              </p>

              {/* Analysis layer cards */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ANALYSIS_LAYERS.map(({ icon, label, desc }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-background/70 px-3 py-3"
                  >
                    <div className="flex items-center gap-1.5 text-[#2F6868]">
                      {icon}
                      <span className="text-[11px] font-semibold">{label}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Account */}
            <div className="relative rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-[#2F6868]/50 hover:shadow-sm">
              <span className="absolute right-4 top-4 rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Optional
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6868]/10 text-[#2F6868]">
                <FlaskConical size={19} />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight">
                Practice with Demo Account
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Paper-trade the full strategy without real capital. Build
                conviction in the system, study the outputs, and go live when
                you're ready.
              </p>
              <div className="mt-4">
                <p className="text-[11px] text-muted-foreground">Supported brokers:</p>
                <div className="mt-1.5 flex flex-col gap-1">
                  <a
                    href="https://www.itiger.com/sg/invest/us-options?_sasdk=dMTlhMDI1ODczOTYyYjhkLTA3YWNkODA5OGQzZDJjLTFmNTI1NjMxLTE0ODQ3ODQtMTlhMDI1ODczOTczMGIx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2F6868] hover:underline"
                  >
                    Tiger Brokers
                    <ExternalLink size={10} strokeWidth={2} />
                  </a>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <a
                      href="https://www.interactivebrokers.com/en/trading/products-options.php?menu=B"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      Interactive Brokers
                      <ExternalLink size={10} strokeWidth={2} />
                    </a>
                    <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
                      Coming Soon
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Get Started ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-14 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2F6868]">
              Get Started
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-5">
              <span className="mt-0.5 shrink-0 text-2xl font-bold tabular-nums text-[#2F6868]/25">01</span>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Sign in to Alpha Team</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Create your Alpha Team account and connect it to your broker. Your positions and buying power sync automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <span className="mt-0.5 shrink-0 text-2xl font-bold tabular-nums text-[#2F6868]/25">02</span>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Tell the assistant your strategy preferences</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Set your DTE window, risk limits, ticker universe, and profit targets. The assistant configures its scoring model around your rules.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <span className="mt-0.5 shrink-0 text-2xl font-bold tabular-nums text-[#2F6868]/25">03</span>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Backtest your strategy</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Run Cash Secured Put (CSP) or Put Credit Spread (PCS) rotation backtests against historical options data to validate your setup before going live.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <span className="mt-0.5 shrink-0 text-2xl font-bold tabular-nums text-[#2F6868]/25">04</span>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Open a brokerage account</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Sign up with Tiger Brokers to trade US options. A demo account is available if you want to practice first.
                </p>
                <a
                  href="https://tigr.link/s/50I5nDt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#2F6868] hover:underline"
                >
                  Deposit and get up to USD 150
                  <ExternalLink size={11} strokeWidth={2} />
                </a>
              </div>
            </div>

            <div className="flex gap-5">
              <span className="mt-0.5 shrink-0 text-2xl font-bold tabular-nums text-[#2F6868]/25">05</span>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Ask for a recommendation</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The assistant researches, scores, and surfaces the best entries — vetted across fundamental, technical, volatility, and risk analysis.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2F6868] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#265858] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6868] focus-visible:ring-offset-2"
            >
              Sign in
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
            <a
              href="https://tigr.link/s/50I5nDt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Open Tiger Brokers account
              <ExternalLink size={13} strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
