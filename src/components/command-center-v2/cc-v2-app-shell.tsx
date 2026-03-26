"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCcV2Modal } from "./cc-v2-modals";
import type { CcV2NavCounts } from "./cc-v2-root";
import type { DashboardAgentRow } from "@/lib/dashboard/build-summary";

type NavEntry =
  | { kind: "section"; label: string }
  | {
      kind: "item";
      href: string;
      icon: string;
      label: string;
      badge?: { n: string; className: string };
    };

function fmtBadge(n: number | undefined) {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(Math.trunc(n));
}

function navFromCounts(counts?: CcV2NavCounts): NavEntry[] {
  const leads = fmtBadge(counts?.leads);
  const campaigns = fmtBadge(counts?.campaigns);
  const followups = fmtBadge(counts?.followups);
  const blog = fmtBadge(counts?.blog);
  const intel = fmtBadge(counts?.intelligence);
  const logs = fmtBadge(counts?.agentLogs);

  return [
    { kind: "section", label: "Overview" },
    { kind: "item", href: "/dashboard", icon: "▦", label: "Dashboard" },
    { kind: "section", label: "Outreach" },
    {
      kind: "item",
      href: "/leads",
      icon: "◈",
      label: "Leads",
      badge: leads ? { n: leads, className: "nc-c" } : undefined,
    },
    {
      kind: "item",
      href: "/campaigns",
      icon: "◉",
      label: "Campaigns",
      badge: campaigns ? { n: campaigns, className: "nc-a" } : undefined,
    },
    { kind: "item", href: "/email-preview", icon: "👁", label: "Email Preview" },
    {
      kind: "item",
      href: "/follow-ups",
      icon: "↩",
      label: "Follow-Ups",
      badge: followups ? { n: followups, className: "nc-r" } : undefined,
    },
    { kind: "section", label: "Content" },
    {
      kind: "item",
      href: "/blog",
      icon: "◇",
      label: "Blog Posts",
      badge: blog ? { n: blog, className: "nc-a" } : undefined,
    },
    { kind: "item", href: "/seo", icon: "◎", label: "SEO" },
    { kind: "section", label: "Intelligence" },
    {
      kind: "item",
      href: "/intelligence",
      icon: "📡",
      label: "Intelligence",
      badge: intel ? { n: intel, className: "nc-c" } : undefined,
    },
    { kind: "item", href: "/memory", icon: "🧠", label: "Memory" },
    { kind: "section", label: "Operations" },
    {
      kind: "item",
      href: "/agent-logs",
      icon: "▤",
      label: "Agent Logs",
      badge: logs ? { n: logs, className: "nc-r" } : undefined,
    },
    { kind: "item", href: "/standups", icon: "☀", label: "Standups" },
    { kind: "item", href: "/agents", icon: "◆", label: "Agents" },
    { kind: "item", href: "/scheduler", icon: "⏱", label: "Scheduler" },
    { kind: "section", label: "Platform" },
    { kind: "item", href: "/products", icon: "⊞", label: "Products" },
    { kind: "item", href: "/branding", icon: "🎨", label: "Branding" },
    { kind: "item", href: "/users", icon: "👤", label: "Users" },
    { kind: "item", href: "/settings", icon: "⚙", label: "Settings" },
    { kind: "item", href: "/billing", icon: "💳", label: "Billing" },
    { kind: "item", href: "/super-admin", icon: "👑", label: "Super Admin" },
  ];
}

function LiveClock() {
  const [text, setText] = useState("09:14:37 UTC");
  useEffect(() => {
    const tick = () => {
      const t = new Date().toUTCString().slice(17, 25);
      setText(`${t} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span id="live-clock">{text}</span>;
}

type AgentStatusChip = {
  key: string;
  label: string;
  title: string;
  bg: string;
  running: boolean;
};

function agentDotBg(status: DashboardAgentRow["status"], agentType: string) {
  if (status === "error") return "var(--red)";
  if (status === "running") return "var(--cyan)";
  if (status === "scheduled") return "var(--amber)";
  if (status === "idle") return "var(--t4)";
  if (status === "success") return "var(--green)";
  return "var(--t2)";
}

function summarizeAgentStatuses(agents?: DashboardAgentRow[] | null) {
  const rows = agents ?? [];
  const counts = { running: 0, error: 0, scheduled: 0 };
  for (const a of rows) {
    if (a.status === "running") counts.running++;
    else if (a.status === "error") counts.error++;
    else if (a.status === "scheduled") counts.scheduled++;
  }

  const order = [
    "lead_sourcing",
    "email_communications",
    "blog_content",
    "seo",
    "channel_scout",
    "standup",
    "dev_qa",
  ];
  const byType = new Map(rows.map((a) => [a.agent_type, a]));
  const dots: AgentStatusChip[] = order
    .map((t) => byType.get(t))
    .filter(Boolean)
    .map((a) => {
      const row = a as DashboardAgentRow;
      const label =
        row.agent_type === "lead_sourcing"
          ? "Lead Sourcer"
          : row.agent_type === "email_communications"
            ? "Email Comms"
            : row.agent_type === "blog_content"
              ? "Blog"
              : row.agent_type === "channel_scout"
                ? "Scout"
                : row.agent_type === "dev_qa"
                  ? "Dev/QA"
                  : row.agent_type === "standup"
                    ? "Standup"
                    : row.agent_type === "seo"
                      ? "SEO"
                      : row.display_name;
      return {
        key: row.agent_type,
        label,
        title: `${label}: ${row.status.toUpperCase()}`,
        bg: agentDotBg(row.status, row.agent_type),
        running: row.status === "running",
      };
    });

  return { counts, dots };
}

export function CcV2AppShell({
  children,
  previewBanner,
  userInitials,
  planLabel,
  trialDaysLeft,
  navCounts,
  agentStatuses,
  orgName,
}: {
  children: React.ReactNode;
  previewBanner?: React.ReactNode;
  userInitials: string;
  planLabel: string;
  trialDaysLeft: number | null;
  navCounts?: CcV2NavCounts;
  agentStatuses?: DashboardAgentRow[] | null;
  orgName?: string | null;
}) {
  const pathname = usePathname();
  const { openModal } = useCcV2Modal();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.classList.add("cc-v2-nav-open");
    } else {
      document.body.classList.remove("cc-v2-nav-open");
    }
    return () => document.body.classList.remove("cc-v2-nav-open");
  }, [mobileNavOpen]);

  const trialDays = trialDaysLeft ?? 9;

  const agentSummary = summarizeAgentStatuses(agentStatuses);

  return (
    <div
      className={`cc-v2-app${mobileNavOpen ? " cc-sidebar-open" : ""}${
        sidebarCollapsed ? " cc-sidebar-collapsed" : ""
      }`}
    >
      {previewBanner}
      <button
        type="button"
        className="cc-nav-backdrop"
        aria-label="Close navigation"
        onClick={() => setMobileNavOpen(false)}
      />
      <div className="shell">
        <header className="topbar">
          <button
            type="button"
            className="cc-nav-toggle"
            aria-expanded={mobileNavOpen}
            aria-controls="cc-primary-nav"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <span className="cc-nav-toggle-bars" aria-hidden />
            <span className="sr-only">Menu</span>
          </button>

          <Link href="/dashboard" className="logo" onClick={() => setMobileNavOpen(false)}>
            <span className="logo-name app-logo" translate="no">
              OpSync
            </span>
          </Link>
          <div className="logo-sep" />
          <span className="org-pill">{orgName?.trim() || "—"}</span>

          <div className="topbar-mid">
            <div className="clock-display">
              <span style={{ color: "var(--t4)", fontSize: 9 }}>SYS</span>
              <LiveClock />
              <span className="clock-sep">·</span>
              <span style={{ color: "var(--t3)", fontSize: 10 }}>26 MAR 2026</span>
            </div>
            <div className="sep-v" />
            <div className="agent-indicators">
              {agentSummary.dots.length ? (
                agentSummary.dots.map((d) => (
                  <div
                    key={d.key}
                    className={`ind${d.running ? " run" : ""}`}
                    style={{ background: d.bg }}
                    title={d.title}
                  />
                ))
              ) : (
                <div className="ind" style={{ background: "var(--t4)" }} title="Agent status unavailable" />
              )}
            </div>
            <div className="sep-v" />
            <span style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t4)" }}>
              {agentSummary.counts.running} RUNNING · {agentSummary.counts.error} ERROR ·{" "}
              {agentSummary.counts.scheduled} SCHEDULED
            </span>
          </div>

          <div className="topbar-right">
            <div className="badge-trial badge-trial--full">TRIAL · {trialDays} DAYS</div>
            <div className="badge-trial badge-trial--compact" title={`Trial · ${trialDays} days left`}>
              {trialDays}d
            </div>
            <button
              type="button"
              className="notif-btn"
              aria-label="Notifications"
              onClick={() => openModal("notif")}
            >
              🔔<div className="notif-dot" />
            </button>
            <div className="sep-v sep-v--desktop" />
            <button
              type="button"
              className="avatar-btn"
              aria-label="Account"
              onClick={() => openModal("profile")}
            >
              {userInitials}
            </button>
          </div>
        </header>

        <div className="mid">
          <div className="sidebar-wrap">
            <nav id="cc-primary-nav" className="sidebar" aria-label="Main navigation">
            {navFromCounts(navCounts).map((entry, i) =>
              entry.kind === "section" ? (
                <div key={`s-${entry.label}-${i}`} className="nav-section">
                  {entry.label}
                </div>
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={`nav-item${
                    pathname === entry.href || pathname.startsWith(`${entry.href}/`) ? " active" : ""
                  }`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="nav-icon">{entry.icon}</span>
                  <span className="nav-label">{entry.label}</span>
                  {entry.badge ? (
                    <span className={`nav-count ${entry.badge.className}`}>{entry.badge.n}</span>
                  ) : null}
                </Link>
              ),
            )}

            <div className="sidebar-foot">
              <div className="plan-box">
                <div className="plan-tier">PLAN: {planLabel}</div>
                <div className="plan-sub">
                  Trial · {trialDays} days left · £149/mo
                </div>
              </div>
            </div>
            </nav>
            <button
              type="button"
              className="cc-sidebar-handle"
              aria-pressed={sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span aria-hidden>{sidebarCollapsed ? "»" : "«"}</span>
            </button>
          </div>

          <main className="content">{children}</main>
        </div>
      </div>
    </div>
  );
}
