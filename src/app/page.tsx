import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";
import { isUiPreviewMode } from "@/lib/ui-preview";

type Props = { searchParams: Promise<{ needs?: string }> };

export default async function Home({ searchParams }: Props) {
  const preview = isUiPreviewMode();
  const needs = (await searchParams).needs;

  return (
    <main className="relative min-h-screen cc-grid-bg px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(232, 121, 249, 0.08), transparent)",
        }}
      />
      {needs === "backend" ? (
        <div className="relative mx-auto mb-8 max-w-lg rounded-xl border border-[var(--cc-amber)]/40 bg-[var(--cc-amber)]/10 px-4 py-3 text-center text-sm text-[var(--cc-amber)]">
          Add Supabase URL and anon key to <code className="font-mono text-xs">.env.local</code>, or enable
          UI preview below.
        </div>
      ) : null}
      <div className="relative mx-auto max-w-lg text-center">
        <div className="cc-font-display inline-flex items-center gap-2 rounded-full border border-[var(--cc-border)] bg-[var(--cc-panel)]/80 px-4 py-1.5 text-sm font-semibold tracking-tight text-[var(--cc-cyan)]">
          OpSync
        </div>
        <h1 className="cc-font-display mt-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Automated marketing operations
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--cc-muted)]">
          Internal CRM in Supabase — agents, sequences, and approvals in one cockpit. Sign in when your
          project is wired, or open a read-only UI preview first.
        </p>
      </div>

      {preview ? (
        <div className="relative mx-auto mt-8 max-w-sm">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center rounded-xl border border-[var(--cc-lime)]/45 bg-[var(--cc-lime)]/15 py-4 font-semibold text-[var(--cc-lime)] shadow-[0_0_32px_rgba(163,230,53,0.12)] transition hover:bg-[var(--cc-lime)]/25"
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
