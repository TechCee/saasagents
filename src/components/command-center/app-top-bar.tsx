import { SystemClock } from "./system-clock";

function initials(email: string | undefined) {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export function AppTopBar({
  userEmail,
  subtitle = "Trustle & Process Pilots",
}: {
  userEmail?: string | null;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--cc-border)] bg-[var(--cc-bg-deep)]/85 px-6 py-4 backdrop-blur-md">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-[var(--cc-cyan)]">CC</span>
          <h1 className="text-lg font-semibold tracking-tight text-white">COMMAND CENTER</h1>
        </div>
        <p className="mt-0.5 text-xs text-[var(--cc-muted)]">{subtitle}</p>
      </div>

      <SystemClock />

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 sm:flex" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-[var(--cc-lime)] shadow-[0_0_8px_#a3e635]" />
          <span className="h-2 w-2 rounded-full bg-[var(--cc-cyan)] shadow-[0_0_8px_#22d3ee]" />
          <span className="h-2 w-2 rounded-full bg-[var(--cc-amber)] opacity-80" />
        </span>
        <span className="rounded-full border border-[var(--cc-amber)]/50 bg-[var(--cc-amber)]/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--cc-amber)]">
          Trial — 9 days
        </span>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--cc-border)] text-slate-400 transition hover:border-[var(--cc-cyan)]/40 hover:text-[var(--cc-cyan)]"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--cc-cyan)]/30 to-[var(--cc-magenta)]/30 font-mono text-xs font-bold text-white ring-1 ring-[var(--cc-border-strong)]"
          title={userEmail ?? ""}
        >
          {initials(userEmail ?? "")}
        </div>
      </div>
    </header>
  );
}
