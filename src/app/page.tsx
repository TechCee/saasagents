import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";
import { isUiPreviewMode } from "@/lib/ui-preview";

type Props = { searchParams: Promise<{ needs?: string }> };

export default async function Home({ searchParams }: Props) {
  const preview = isUiPreviewMode();
  const needs = (await searchParams).needs;

  return (
    <main className="relative min-h-dvh min-h-screen cc-grid-bg px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] sm:px-6 sm:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(232, 121, 249, 0.08), transparent)",
        }}
      />
      {needs === "backend" ? (
        <div className="relative mx-auto mb-6 max-w-lg rounded-xl border border-[var(--cc-amber)]/40 bg-[var(--cc-amber)]/10 px-4 py-3 text-center text-sm leading-relaxed text-[var(--cc-amber)] sm:mb-8">
          Add Supabase URL and anon key to <code className="font-mono text-xs">.env.local</code>, or enable
          UI preview below.
        </div>
      ) : null}
      <div className="relative mx-auto max-w-lg px-1 text-center text-balance">
        <div className="cc-font-display inline-flex items-center gap-2 rounded-full border border-[var(--cc-border)] bg-[var(--cc-panel)]/80 px-4 py-1.5 text-sm font-semibold tracking-tight text-[var(--cc-cyan)]">
          OpSync
        </div>
        <h1 className="cc-font-display mt-5 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:mt-6 sm:text-4xl">
          Automated marketing operations
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--cc-muted)] sm:text-base">
          Internal CRM in Supabase — agents, sequences, and approvals in one cockpit. Sign in when your
          project is wired, or open a read-only UI preview first.
        </p>
      </div>

      {preview ? (
        <div className="relative mx-auto mt-8 max-w-sm px-0">
          <Link
            href="/dashboard"
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[var(--cc-lime)]/45 bg-[var(--cc-lime)]/15 px-3 py-3.5 text-center text-sm font-semibold leading-snug text-[var(--cc-lime)] shadow-[0_0_32px_rgba(163,230,53,0.12)] transition active:bg-[var(--cc-lime)]/25 sm:min-h-0 sm:py-4 sm:text-base"
          >
            Open dashboard — UI preview (no login)
          </Link>
          <p className="mt-3 text-center font-mono text-[10px] text-[var(--cc-muted)]">
            Set in <code className="text-[var(--cc-cyan)]">.env.local</code>:{" "}
            <code className="text-[var(--cc-cyan)]">UI_PREVIEW_MODE=true</code>
          </p>
        </div>
      ) : null}

      <SignInForm showPreviewHint={preview} />
      <p className="relative mx-auto mt-10 max-w-md text-center font-mono text-[10px] text-slate-600">
        v5.1 · Trustle &amp; Process Pilots
      </p>
    </main>
  );
}
