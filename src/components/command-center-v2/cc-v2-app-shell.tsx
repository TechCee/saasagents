"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCcV2Modal } from "./cc-v2-modals";

type NavEntry =
  | { kind: "section"; label: string }
  | {
      kind: "item";
      href: string;
      icon: string;
      label: string;
      badge?: { n: string; className: string };
    };

const NAV: NavEntry[] = [
  { kind: "section", label: "Overview" },
  { kind: "item", href: "/dashboard", icon: "▦", label: "Dashboard" },
  { kind: "section", label: "Outreach" },
  { kind: "item", href: "/leads", icon: "◈", label: "Leads", badge: { n: "247", className: "nc-c" } },
  { kind: "item", href: "/campaigns", icon: "◉", label: "Campaigns", badge: { n: "3", className: "nc-a" } },
  { kind: "item", href: "/email-preview", icon: "👁", label: "Email Preview" },
  { kind: "item", href: "/follow-ups", icon: "↩", label: "Follow-Ups", badge: { n: "14", className: "nc-r" } },
  { kind: "section", label: "Content" },
  { kind: "item", href: "/blog", icon: "◇", label: "Blog Posts", badge: { n: "2", className: "nc-a" } },
  { kind: "item", href: "/seo", icon: "◎", label: "SEO" },
  { kind: "section", label: "Intelligence" },
  {
    kind: "item",
    href: "/intelligence",
    icon: "📡",
    label: "Intelligence",
    badge: { n: "18", className: "nc-c" },
  },
  { kind: "item", href: "/memory", icon: "🧠", label: "Memory" },
  { kind: "section", label: "Operations" },
  { kind: "item", href: "/agent-logs", icon: "▤", label: "Agent Logs", badge: { n: "1", className: "nc-r" } },
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

export function CcV2AppShell({
  children,
  previewBanner,
  userInitials,
  planLabel,
  trialDaysLeft,
}: {
  children: React.ReactNode;
  previewBanner?: React.ReactNode;
  userInitials: string;
  planLabel: string;
  trialDaysLeft: number | null;
}) {
  const pathname = usePathname();
  const { openModal } = useCcV2Modal();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  return (
    <div className={`cc-v2-app${mobileNavOpen ? " cc-sidebar-open" : ""}`}>
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
          <span className="org-pill">Trustle &amp; Process Pilots</span>

          <div className="topbar-mid">
            <div className="clock-display">
              <span style={{ color: "var(--t4)", fontSize: 9 }}>SYS</span>
              <LiveClock />
              <span className="clock-sep">·</span>
              <span style={{ color: "var(--t3)", fontSize: 10 }}>26 MAR 2026</span>
            </div>
            <div className="sep-v" />
            <div className="agent-indicators">
              <div className="ind run" style={{ background: "var(--cyan)" }} title="Lead Sourcer: RUNNING" />
              <div className="ind run" style={{ background: "var(--cyan)" }} title="Email Comms: RUNNING" />
              <div className="ind" style={{ background: "var(--green)" }} title="Blog: OK" />
              <div className="ind" style={{ background: "var(--red)" }} title="Dev/QA: ERROR" />
              <div className="ind" style={{ background: "var(--green)" }} title="SEO: OK" />
              <div className="ind" style={{ background: "var(--amber)" }} title="Scout: SCHEDULED" />
              <div className="ind" style={{ background: "var(--amber)" }} title="Standup: SCHEDULED" />
            </div>
            <div className="sep-v" />
            <span style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t4)" }}>
              2 RUNNING · 1 ERROR · 4 SCHEDULED
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
          <nav id="cc-primary-nav" className="sidebar" aria-label="Main navigation">
            {NAV.map((entry, i) =>
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

          <main className="content">{children}</main>
        </div>
      </div>
    </div>
  );
}
