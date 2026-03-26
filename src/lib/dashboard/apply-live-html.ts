import type {
  DashboardApproval,
  DashboardFeedItem,
  DashboardSummaryJson,
  DashboardAgentRow,
  DashboardStandupCard,
} from "@/lib/dashboard/build-summary";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAgentRow(a: DashboardAgentRow): string {
  const dotRun = a.dot_class === "run" ? " run" : "";
  const dotBg =
    a.status === "error"
      ? "var(--red)"
      : a.status === "running"
        ? "var(--cyan)"
        : a.status === "success"
          ? "var(--green)"
          : "var(--amber)";
  const chipInner =
    a.chip_label === "RUNNING"
      ? `<span class="dot"></span>${esc(a.chip_label)}`
      : esc(a.chip_label);
  return `<div class="agent-row"><div class="ar-dot${dotRun}" style="background:${dotBg}"></div><span style="font-size:13px;color:${esc(a.icon_color_var)}">${esc(a.icon)}</span><span class="ar-name">${esc(a.display_name)}</span><span class="chip ${a.chip_class}">${chipInner}</span><span class="ar-next" style="margin-left:auto">${esc(a.subtitle)}</span></div>`;
}

function renderApproval(a: DashboardApproval): string {
  const border =
    a.accent === "cyan"
      ? "var(--cyan)"
      : a.accent === "green"
        ? "var(--green)"
        : a.accent === "purple"
          ? "var(--purple)"
          : "var(--amber)";
  const typeLabel =
    a.kind === "email"
      ? "EMAIL"
      : a.kind === "blog"
        ? "BLOG DRAFT"
        : "SEO";
  const typeColor = border;
  const revNav =
    a.kind === "blog" ? "blog" : a.kind === "seo" ? "seo" : "emailpreview";
  const revLabel =
    a.kind === "blog" ? "READ DRAFT" : a.kind === "seo" ? "VIEW SEO" : "PREVIEW";
  return `<div class="appr-card" style="border-left:3px solid ${border}"><div class="ac-top"><span class="ac-type" style="color:${typeColor}">${typeLabel}</span><span class="ac-age">${esc(a.age)}</span></div><div class="ac-title">${esc(a.title)}</div><div class="ac-btns"><div class="acb-ok">✓ APPROVE</div><div class="acb-rev" data-cc-nav="${revNav}" role="link" tabindex="0">👁 ${esc(revLabel)}</div></div></div>`;
}

function renderStandup(s: DashboardStandupCard): string {
  const dot = s.chip_dot ? '<span class="dot"></span>' : "";
  return `<div class="std-card"><div class="std-accent" style="background:${esc(s.accent)}"></div><div class="std-head"><div class="std-agent"><span style="color:${esc(s.accent)};font-size:14px">${esc(s.icon)}</span><div><div class="std-name">${esc(s.display_name)}</div><div class="std-sub">${esc(s.sub)}</div></div></div><span class="chip ${s.chip_class}" style="font-size:7px">${dot}${esc(s.chip)}</span></div><div class="std-lbl">${esc(s.label)}</div><div class="std-text">${esc(s.body)}</div></div>`;
}

function renderFeedItem(f: DashboardFeedItem): string {
  const line = `<div class="feed-line"></div>`;
  const bodyClass = f.error ? ' style="color:var(--red)"' : "";
  return `<div class="feed-item"><div class="feed-dot" style="background:${esc(f.color)}"></div>${line}<div class="feed-body"><div class="feed-text"${bodyClass}>${esc(f.text)}</div><div class="feed-time">${esc(f.time)}</div></div></div>`;
}

export function applyDashboardLiveData(
  mount: HTMLElement,
  d: DashboardSummaryJson,
) {
  const fmt = (n: number) => n.toLocaleString("en-US");

  const setKpi = (key: string, val: string) => {
    const el = mount.querySelector(`[data-cc-kpi="${key}"]`);
    if (el) el.textContent = val;
  };
  const setDelta = (key: string, val: string) => {
    const el = mount.querySelector(`[data-cc-kpi-delta="${key}"]`);
    if (el) el.textContent = val;
  };

  setKpi("leads_week", fmt(d.kpis.leads_week));
  const lwd = d.kpis.leads_week_delta;
  setDelta(
    "leads_week",
    lwd >= 0
      ? `▲ +${lwd} vs prior week`
      : `▼ ${lwd} vs prior week`,
  );

  setKpi("emails_month", fmt(d.kpis.emails_sent_month));
  setDelta("emails_month", "Sent campaigns (month)");

  setKpi("open_rate", d.kpis.avg_open_rate);
  setDelta("open_rate", "Track in email provider");

  setKpi("posts_month", fmt(d.kpis.posts_published_month));
  setDelta("posts_month", "Published / scheduled");

  setKpi("enrolments", fmt(d.kpis.active_enrolments));
  setDelta("enrolments", "Active sequence seats");

  const agentsRoot = mount.querySelector("[data-cc-agents]");
  if (agentsRoot) {
    agentsRoot.innerHTML = d.agents.map(renderAgentRow).join("");
  }

  const apprRoot = mount.querySelector("[data-cc-approvals]");
  if (apprRoot) {
    apprRoot.innerHTML =
      d.approvals.length > 0
        ? d.approvals.map(renderApproval).join("")
        : `<div class="appr-card" style="border-left:3px solid var(--t3)"><div class="ac-title" style="color:var(--t3)">No pending approvals — drafts will appear here.</div></div>`;
  }

  const apprBadge = mount.querySelector("[data-cc-approval-count]");
  if (apprBadge) {
    apprBadge.textContent = String(d.approval_count);
  }

  const standDate = mount.querySelector("[data-cc-standups-date]");
  if (standDate) {
    standDate.textContent = d.standups_date_label;
  }

  const standRoot = mount.querySelector("[data-cc-standups]");
  if (standRoot) {
    standRoot.innerHTML = d.standups.map(renderStandup).join("");
  }

  const feedRoot = mount.querySelector("[data-cc-feed]");
  if (feedRoot) {
    feedRoot.innerHTML = d.feed.map(renderFeedItem).join("");
  }
}
