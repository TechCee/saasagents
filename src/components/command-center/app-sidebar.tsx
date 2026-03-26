"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string; badgeKey?: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads", badgeKey: "leads" },
  { href: "/campaigns", label: "Campaigns", badgeKey: "campaigns" },
  { href: "/blog", label: "Blog Posts", badgeKey: "blog" },
  { href: "/agent-logs", label: "Agent Logs", badgeKey: "agentLogs" },
  { href: "/standups", label: "Standups" },
  { href: "/scheduler", label: "Scheduler" },
  { href: "/seo", label: "SEO" },
  { href: "/products", label: "Products" },
  { href: "/agents", label: "Agents" },
  { href: "/users", label: "Users" },
  { href: "/settings", label: "Settings" },
];

export type NavBadgeCounts = Partial<{
  leads: number;
  campaigns: number;
  blog: number;
  agentLogs: number;
}>;

export function AppSidebar({
  leadsTotal,
  planLabel,
  trialDaysLeft,
  badgeCounts,
}: {
  leadsTotal: number;
  planLabel: string;
  trialDaysLeft: number | null;
  /** Optional per-route badges (mockup: 247 / 3 / 2 / 1). Falls back to leadsTotal for Leads only. */
  badgeCounts?: NavBadgeCounts;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-[var(--cc-border)] bg-[var(--cc-panel)]/90 backdrop-blur-sm">
      <div className="border-b border-[var(--cc-border)] px-4 py-5">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-[var(--cc-cyan)]">
          CC
        </div>
        <div className="mt-1 text-sm font-semibold text-white">COMMAND CENTER</div>
        <div className="mt-2 text-[11px] leading-snug text-[var(--cc-muted)]">
          Trustle &amp; Process Pilots
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          let badge: number | undefined;
          if (
            item.badgeKey &&
            badgeCounts &&
            item.badgeKey in badgeCounts &&
            badgeCounts[item.badgeKey as keyof NavBadgeCounts] != null
          ) {
            badge = badgeCounts[item.badgeKey as keyof NavBadgeCounts];
          } else if (item.href === "/leads" && leadsTotal > 0) {
            badge = leadsTotal;
          }
          const isCyanBadge =
            item.badgeKey === "leads" || item.badgeKey === "campaigns" || item.badgeKey === "blog";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--cc-cyan)]/10 text-[var(--cc-cyan)] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span>{item.label}</span>
              {badge != null && badge > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    isCyanBadge
                      ? "bg-[var(--cc-cyan)]/20 text-[var(--cc-cyan)]"
                      : "bg-[var(--cc-magenta)]/20 text-[var(--cc-magenta)]"
                  }`}
                >
                  {badge.toLocaleString()}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--cc-border)] px-3 py-4">
        <div className="rounded-lg border border-[var(--cc-border)] bg-[var(--cc-panel-elevated)] px-3 py-2.5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--cc-amber)]">
            PLAN: {planLabel}
          </div>
          {trialDaysLeft != null ? (
            <div className="mt-1 text-xs text-slate-400">
              Trial — <span className="text-[var(--cc-lime)]">{trialDaysLeft} days</span> left
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-500">Subscription active</div>
          )}
        </div>
      </div>
    </aside>
  );
}
