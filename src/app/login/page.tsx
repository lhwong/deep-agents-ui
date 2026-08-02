import Link from "next/link";
import { signIn } from "@/auth";
import { BackendWarmup } from "./BackendWarmup";
import { ArrowLeft } from "lucide-react";

// ── Provider icons ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <BackendWarmup />

      {/* Subtle radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[500px] w-[600px] rounded-full bg-[#2F6868]/6 blur-3xl" />
      </div>

      {/* Back link */}
      <div className="absolute left-6 top-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back
        </Link>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#2F6868]">
            Alpha Team
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your trading assistant
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          {/* Google */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/chat" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          {/* GitHub */}
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/chat" });
            }}
            className="mt-3"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Credentials */}
          <form
            action={async (formData) => {
              "use server";
              await signIn("credentials", formData);
            }}
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="redirectTo" value="/chat" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              autoComplete="username"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#2F6868]/60 focus:outline-none focus:ring-2 focus:ring-[#2F6868]/20"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#2F6868]/60 focus:outline-none focus:ring-2 focus:ring-[#2F6868]/20"
            />
            <button
              type="submit"
              className="mt-1 w-full rounded-xl bg-[#2F6868] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#265858] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6868] focus-visible:ring-offset-2"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
