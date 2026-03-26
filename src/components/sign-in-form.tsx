"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignInForm({ showPreviewHint = false }: { showPreviewHint?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative mx-auto mt-8 max-w-sm space-y-4 rounded-2xl border border-[var(--cc-border-strong)] bg-[var(--cc-panel)]/90 px-5 py-6 shadow-[0_0_80px_rgba(34,211,238,0.06)] backdrop-blur-md cc-glow-cyan sm:mt-10 sm:space-y-5 sm:px-8 sm:py-8"
    >
      <div>
        <h2 className="cc-font-display text-lg font-semibold text-white">Secure access</h2>
        <p className="mt-1 text-xs text-[var(--cc-muted)]">
          Supabase Auth (email provider). Your data stays in your internal CRM.
        </p>
        {showPreviewHint ? (
          <p className="mt-2 text-[11px] text-[var(--cc-amber)]">
            UI preview is on — use the green button above to skip login. Use this form once Supabase is
            configured.
          </p>
        ) : null}
      </div>
      <label className="block text-sm">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--cc-cyan)]">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-3 py-3 text-base text-white outline-none ring-[var(--cc-cyan)]/30 placeholder:text-slate-600 focus:ring-2 sm:min-h-0 sm:py-2.5 sm:text-sm"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--cc-cyan)]">
          Password
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-3 py-2.5 text-sm text-white outline-none ring-[var(--cc-cyan)]/30 focus:ring-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {msg ? (
        <p className="rounded-lg border border-[var(--cc-rose)]/40 bg-[var(--cc-rose)]/10 px-3 py-2 text-xs text-[var(--cc-rose)]">
          {msg}
        </p>
      ) : null}
      <button
        type="submit"
        className="min-h-12 w-full rounded-lg bg-gradient-to-r from-[var(--cc-cyan)]/90 to-[var(--cc-cyan)]/70 py-3 text-base font-semibold text-[var(--cc-bg-deep)] shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:brightness-110 active:brightness-95 sm:min-h-0 sm:py-2.5 sm:text-sm"
      >
        Sign in to OpSync
      </button>
    </form>
  );
}
