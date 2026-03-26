"use client";

import { useMemo, useState } from "react";

export type EnrolmentRow = {
  id: string;
  status: string;
  next_send_at: string | null;
  /** e.g. FU-2 of 3 */
  fuTag?: string | null;
  /** e.g. DUE: TODAY */
  dueLabel?: string | null;
  lead: {
    first_name: string | null;
    last_name: string | null;
    company: string | null;
    job_title: string | null;
  } | null;
};

const TABS = ["Active", "Replied", "Exhausted", "Bounced"] as const;

export type EnrolmentTabCounts = {
  active: number;
  replied: number;
  exhausted: number;
  bounced: number;
};

function statusMatchesTab(status: string, tab: (typeof TABS)[number]) {
  const s = status.toLowerCase();
  if (tab === "Active") return s === "active" || s === "paused";
  if (tab === "Replied") return s === "replied";
  if (tab === "Exhausted") return s === "completed";
  if (tab === "Bounced") return s === "bounced";
  return false;
}

function fakeTags(seed: string) {
  const pools = [
    ["VALUE-ADD", "CURIOUS"],
    ["STOPPED", "NURTURE"],
    ["HIGH-INTENT", "REPLY"],
  ];
  const i = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % pools.length;
  return pools[i] ?? pools[0];
}

function tabCount(t: (typeof TABS)[number], counts: EnrolmentTabCounts): number {
  if (t === "Active") return counts.active;
  if (t === "Replied") return counts.replied;
  if (t === "Exhausted") return counts.exhausted;
  return counts.bounced;
}

export function DashboardEnrolments({
  rows,
  tabCounts,
}: {
  rows: EnrolmentRow[];
  tabCounts: EnrolmentTabCounts;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Active");

  const filtered = useMemo(
    () => rows.filter((r) => statusMatchesTab(r.status, tab)),
    [rows, tab],
  );

  return (
    <div className="rounded-xl border border-[var(--cc-border)] bg-[#0B111B]/80 cc-glow-cyan">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cc-border)] px-4 py-3">
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--cc-muted)]">
          // <span className="text-white">ACTIVE FOLLOW-UP</span>
        </h2>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] font-semibold tracking-wide ${
                tab === t
                  ? "bg-[var(--cc-cyan)]/20 text-[var(--cc-cyan)] ring-1 ring-[var(--cc-cyan)]/35"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              }`}
            >
              <span className="text-white">{tabCount(t, tabCounts)}</span>{" "}
              <span className="uppercase">{t}</span>
            </button>
          ))}
        </div>
      </div>
      <ul className="max-h-[280px] divide-y divide-[var(--cc-border)] overflow-auto">
        {filtered.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-[var(--cc-muted)]">No rows for this filter.</li>
        ) : (
          filtered.map((r) => {
            const name = [r.lead?.first_name, r.lead?.last_name].filter(Boolean).join(" ") || "—";
            const co = r.lead?.company ?? "—";
            const title = r.lead?.job_title ?? "";
            const tags = [
              ...(r.fuTag ? [r.fuTag] : []),
              ...fakeTags(r.id).filter((t) => t !== r.fuTag),
            ].slice(0, 3);
            const dueLine = r.dueLabel
              ? r.dueLabel
              : r.next_send_at
                ? `DUE: ${new Date(r.next_send_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}`
                : "—";
            return (
              <li key={r.id} className="flex flex-wrap items-start gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium tracking-tight text-white">{name}</div>
                  <div className="text-xs text-[var(--cc-muted)]">
                    {co}
                    {title ? ` · ${title}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-[var(--cc-lime)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] font-semibold tracking-wide text-[var(--cc-amber)]">
                  {dueLine}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
