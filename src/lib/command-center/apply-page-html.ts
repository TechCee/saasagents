import type { CommandCenterPage } from "@/lib/command-center/page-types";
import { escHtml } from "@/lib/html-escape";

function setText(
  root: HTMLElement,
  sel: string,
  text: string,
) {
  const el = root.querySelector(sel);
  if (el) el.textContent = text;
}

function fmtInt(n: number) {
  return n.toLocaleString("en-US");
}

export function applyCommandCenterPageData(
  root: HTMLElement,
  page: CommandCenterPage,
  data: Record<string, unknown>,
) {
  switch (page) {
    case "leads":
      applyLeads(root, data);
      break;
    case "campaigns":
      applyCampaigns(root, data);
      break;
    case "emailpreview":
      applyEmailPreview(root, data);
      break;
    case "followups":
      applyFollowups(root, data);
      break;
    case "blog":
      applyBlog(root, data);
      break;
    case "seo":
      applySeo(root, data);
      break;
    case "intelligence":
      applyIntel(root, data);
      break;
    case "memory":
      applyMemory(root, data);
      break;
    case "logs":
      applyLogs(root, data);
      break;
    case "standups":
      applyStandups(root, data);
      break;
    case "agents":
      applyAgents(root, data);
      break;
    case "scheduler":
      applyScheduler(root, data);
      break;
    case "products":
      applyProducts(root, data);
      break;
    case "branding":
      applyBranding(root, data);
      break;
    case "users":
      applyUsers(root, data);
      break;
    case "settings":
      applySettings(root, data);
      break;
    case "billing":
      applyBilling(root, data);
      break;
    case "superadmin":
      applySuperAdmin(root, data);
      break;
    default:
      break;
  }
}

function applyLeads(root: HTMLElement, d: Record<string, unknown>) {
  const kpis = d.kpis as Record<string, unknown> | undefined;
  if (kpis) {
    setText(root, '[data-cc-kpi="l_total"]', fmtInt(Number(kpis.total ?? 0)));
    setText(root, '[data-cc-kpi-delta="l_total"]', String(kpis.total_delta ?? ""));
    setText(root, '[data-cc-kpi="l_qualified"]', fmtInt(Number(kpis.qualified ?? 0)));
    setText(root, '[data-cc-kpi-delta="l_qualified"]', String(kpis.qualified_delta ?? ""));
    setText(root, '[data-cc-kpi="l_seq"]', fmtInt(Number(kpis.in_sequence ?? 0)));
    setText(root, '[data-cc-kpi="l_replied"]', fmtInt(Number(kpis.replied ?? 0)));
    setText(root, '[data-cc-kpi-delta="l_replied"]', String(kpis.reply_rate ?? ""));
    setText(root, '[data-cc-kpi="l_optout"]', fmtInt(Number(kpis.opted_out ?? 0)));
  }
  const leads = d.leads as Record<string, unknown>[] | undefined;
  const tb = root.querySelector("[data-cc-live='leads-tbody']");
  if (tb && leads) {
    tb.innerHTML = leads
      .map((l) => {
        const st = escHtml(l.status as string);
        const chip =
          st.includes("REPLIED") || st === "REPLIED"
            ? "ch-g"
            : st === "NEW"
              ? "ch-p"
              : "ch-c";
        const dot = chip === "ch-c" && st !== "NEW" ? '<span class="dot"></span>' : "";
        return `<tr data-cc-modal="lead-detail" role="button" tabindex="0"><td><div class="cell-name"><div class="n">${escHtml(l.name as string)}</div><div class="s">${escHtml(l.title as string)}</div></div></td><td class="nm">${escHtml(l.company as string)}</td><td><span class="tag tag-c">${escHtml(l.product as string)}</span></td><td class="mn">${escHtml(l.source as string)}</td><td><div class="score-wrap"><div class="score-bar"><div class="score-fill" style="width:${l.score_width}%;background:${l.bar_color}"></div></div><span class="score-num" style="color:${l.bar_color}">${l.score}</span></div></td><td><span class="chip ${chip}">${dot}${st}</span></td><td class="mn" style="color:var(--cyan)">${escHtml(l.sequence as string)}</td><td class="mn">${escHtml(l.last_contact as string)}</td><td><button type="button" class="btn btn-ghost btn-xs">VIEW</button></td></tr>`;
      })
      .join("");
  }
  setText(root, "[data-cc-live='leads-footer']", String(d.footer ?? ""));
}

function applyCampaigns(root: HTMLElement, d: Record<string, unknown>) {
  const kpis = d.kpis as Record<string, unknown> | undefined;
  if (kpis) {
    setText(root, '[data-cc-kpi="c_drafts"]', fmtInt(Number(kpis.drafts ?? 0)));
    setText(root, '[data-cc-kpi="c_sent"]', fmtInt(Number(kpis.sent_month ?? 0)));
    setText(root, '[data-cc-kpi="c_open"]', String(kpis.open_rate ?? "—"));
    setText(root, '[data-cc-kpi="c_reply"]', String(kpis.reply_rate ?? "—"));
    setText(root, '[data-cc-kpi="c_seq"]', fmtInt(Number(kpis.sequences ?? 0)));
  }
  const badge = root.querySelector("[data-cc-live='c-draft-badge']");
  if (badge) badge.textContent = String(d.draft_tab_badge ?? 0);
  const rows = d.campaigns as Record<string, unknown>[] | undefined;
  const tb = root.querySelector("[data-cc-live='campaigns-tbody']");
  if (tb && rows) {
    tb.innerHTML = rows
      .map((r) => {
        const st = String(r.status);
        const chip =
          st === "SENT" ? "ch-c" : "ch-a";
        return `<tr><td><div class="cell-name"><div class="n">${escHtml(r.title as string)}</div><div class="s">${escHtml(r.subtitle as string)}</div></div></td><td><span class="tag tag-c">${escHtml(r.product as string)}</span></td><td><span class="chip ${chip}">${escHtml(st)}</span></td><td class="mn">${r.recipients}</td><td class="mn" style="color:var(--t3)">${escHtml(r.open as string)}</td><td class="mn" style="color:var(--t3)">${escHtml(r.reply as string)}</td><td class="mn" style="color:var(--cyan)">${escHtml(r.fus as string)}</td><td class="mn">${escHtml(r.created as string)}</td><td><div style="display:flex;gap:4px"><button type="button" class="btn btn-ghost btn-xs" data-cc-nav="emailpreview">PREVIEW</button></div></td></tr>`;
      })
      .join("");
  }
}

function applyEmailPreview(root: HTMLElement, d: Record<string, unknown>) {
  setText(root, "[data-cc-live='ep-title']", String(d.title ?? ""));
  setText(root, "[data-cc-live='ep-from']", String(d.from_addr ?? ""));
  setText(root, "[data-cc-live='ep-recipients']", String(d.recipients ?? ""));
  const subA = root.querySelector<HTMLInputElement>("[data-cc-live='ep-subject-a']");
  if (subA) subA.value = String(d.subject_a ?? "");
  const prev = root.querySelector<HTMLInputElement>("[data-cc-live='ep-preview']");
  if (prev) prev.value = String(d.preview_text ?? "");
  const subjLine = root.querySelector("[data-cc-live='ep-subj-line']");
  if (subjLine) subjLine.textContent = String(d.subj_line ?? "");
  const prevLine = root.querySelector("[data-cc-live='ep-prev-line']");
  if (prevLine) prevLine.textContent = String(d.prev_line ?? "");
  const body = root.querySelector("[data-cc-live='ep-body-inner']");
  if (body) body.innerHTML = String(d.body_html ?? "");
}

function applyFollowups(root: HTMLElement, d: Record<string, unknown>) {
  const k = d.kpis as Record<string, unknown> | undefined;
  if (k) {
    setText(root, '[data-cc-kpi="fu_active"]', fmtInt(Number(k.active ?? 0)));
    setText(root, '[data-cc-kpi="fu_replied"]', fmtInt(Number(k.replied ?? 0)));
    setText(root, '[data-cc-kpi="fu_done"]', fmtInt(Number(k.exhausted ?? 0)));
    setText(root, '[data-cc-kpi="fu_due"]', fmtInt(Number(k.due_today ?? 0)));
  }
  const rows = d.tracker as Record<string, unknown>[] | undefined;
  const tb = root.querySelector("[data-cc-live='followups-tbody']");
  if (tb && rows) {
    tb.innerHTML = rows
      .map(
        (r) =>
          `<tr><td><div class="cell-name"><div class="n">${escHtml(r.name as string)}</div><div class="s">${escHtml(r.sub as string)}</div></div></td><td><span class="tag tag-c">${escHtml(r.product as string)}</span></td><td class="sm">${escHtml(r.campaign as string)}</td><td><span class="chip ch-c">${escHtml(r.step as string)}</span></td><td class="mn" style="color:var(--cyan)">${escHtml(r.tone as string)}</td><td><span class="chip ch-a">${escHtml(r.status as string)}</span></td><td class="mn">${escHtml(r.next_due as string)}</td><td><button type="button" class="btn btn-ghost btn-xs" data-cc-nav="emailpreview">PREVIEW</button></td></tr>`,
      )
      .join("");
  }
}

function applyBlog(root: HTMLElement, d: Record<string, unknown>) {
  const k = d.kpis as Record<string, unknown> | undefined;
  if (k) {
    setText(root, '[data-cc-kpi="b_drafts"]', fmtInt(Number(k.drafts ?? 0)));
    setText(root, '[data-cc-kpi="b_pub"]', fmtInt(Number(k.published ?? 0)));
    setText(root, '[data-cc-kpi="b_words"]', fmtInt(Number(k.avg_words ?? 0)));
    setText(root, '[data-cc-kpi="b_seo"]', fmtInt(Number(k.seo_ready ?? 0)));
  }
  const badge = root.querySelector("[data-cc-live='blog-draft-badge']");
  if (badge) badge.textContent = String(d.draft_badge ?? 0);
  const posts = d.posts as Record<string, unknown>[] | undefined;
  const grid = root.querySelector("[data-cc-live='blog-grid']");
  if (grid && posts) {
    grid.innerHTML = posts
      .map(
        (p) =>
          `<div class="blog-card" style="border-left:3px solid ${p.border}"><div class="bc-top"><div><span class="bc-title">${escHtml(p.title as string)}</span><div style="display:flex;gap:6px;align-items:center;margin-top:5px"><span class="tag tag-c">${escHtml(p.product as string)}</span><span class="chip ${p.chip_class}">${escHtml(p.status as string)}</span></div></div></div><div class="bc-excerpt">${escHtml(p.excerpt as string)}</div><div class="bc-meta"><span>${escHtml(p.meta as string)}</span><span></span><span>${escHtml(p.date as string)}</span></div><div class="bc-btns"><button type="button" class="btn btn-ghost btn-xs">OPEN</button></div></div>`,
      )
      .join("");
  }
}

function applySeo(root: HTMLElement, d: Record<string, unknown>) {
  const k = d.kpis as Record<string, unknown> | undefined;
  if (k) {
    setText(root, '[data-cc-kpi="seo_pos"]', String(k.avg_pos ?? "—"));
    setText(root, '[data-cc-kpi="seo_impr"]', String(k.impressions ?? "—"));
    setText(root, '[data-cc-kpi="seo_clicks"]', String(k.clicks ?? "—"));
    setText(root, '[data-cc-kpi="seo_open"]', fmtInt(Number(k.open_actions ?? 0)));
  }
  const recs = d.recommendations as Record<string, unknown>[] | undefined;
  const host = root.querySelector("[data-cc-live='seo-recs']");
  if (host && recs?.length) {
    host.innerHTML = recs
      .map(
        (r) =>
          `<div style="background:var(--bg3);border:1px solid var(--b1);border-left:3px solid var(--amber);border-radius:var(--r);padding:9px 11px"><div style="font-size:12px;font-weight:500;color:var(--t1);margin-bottom:3px">${escHtml(r.title as string)}</div><div style="font-size:10px;color:var(--t3)">${escHtml(r.detail as string)}</div></div>`,
      )
      .join("");
  }
  const ranks = d.rank_rows as Record<string, unknown>[] | undefined;
  const rh = root.querySelector("[data-cc-live='seo-ranks']");
  if (rh && ranks?.length) {
    rh.innerHTML = ranks
      .map(
        (r) =>
          `<div class="rank-row"><div class="rank-n" style="color:var(--t2)">${escHtml(r.pos as string)}</div><div class="rank-info"><div class="rank-url">${escHtml(r.url as string)}</div><div class="rank-title">${escHtml(r.title as string)}</div></div><div class="rank-stats"></div></div>`,
      )
      .join("");
  }
}

function applyIntel(root: HTMLElement, d: Record<string, unknown>) {
  const k = d.kpis as Record<string, unknown> | undefined;
  if (k) {
    setText(root, '[data-cc-kpi="i_find"]', fmtInt(Number(k.findings_week ?? 0)));
    setText(root, '[data-cc-kpi="i_pain"]', fmtInt(Number(k.pain ?? 0)));
    setText(root, '[data-cc-kpi="i_warm"]', fmtInt(Number(k.warm ?? 0)));
    setText(root, '[data-cc-kpi="i_comp"]', fmtInt(Number(k.competitor ?? 0)));
    setText(root, '[data-cc-kpi="i_trend"]', fmtInt(Number(k.trending ?? 0)));
  }
  const feed = d.feed as Record<string, unknown>[] | undefined;
  const fh = root.querySelector("[data-cc-live='intel-feed']");
  if (fh && feed?.length) {
    fh.innerHTML = feed
      .map(
        (r) =>
          `<div class="intel-card" style="border-left:3px solid var(--cyan)"><div class="ic-top"><div class="ic-meta"><span style="font-family:var(--fm);font-size:8px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--cyan-a10);color:var(--cyan)">${escHtml(r.cat as string)}</span><span class="ic-channel">${escHtml(r.channel as string)}</span></div><span class="tag tag-c">${escHtml(r.product as string)}</span></div><div class="ic-title">${escHtml(r.title as string)}</div><div class="ic-body">${escHtml(r.body as string)}</div></div>`,
      )
      .join("");
  }
}

function applyMemory(root: HTMLElement, d: Record<string, unknown>) {
  const k = d.kpis as Record<string, unknown> | undefined;
  if (k) {
    setText(root, '[data-cc-kpi="m_total"]', fmtInt(Number(k.total ?? 0)));
    setText(root, '[data-cc-kpi="m_dec"]', String(k.decision ?? "—"));
    setText(root, '[data-cc-kpi="m_intel"]', String(k.intel ?? "—"));
  }
  const recent = d.recent as Record<string, unknown>[] | undefined;
  const mh = root.querySelector("[data-cc-live='memory-list']");
  if (mh && recent) {
    mh.innerHTML = recent
      .map(
        (m) =>
          `<div class="mem-card"><div class="mc-top"><div class="mc-left"><span class="mc-type mct-decision">${escHtml(m.type as string)}</span><span style="font-family:var(--fm);font-size:9px;color:var(--t3)">${escHtml(m.agent as string)}</span></div><div class="mc-imp">★ ${m.importance}</div></div><div class="mc-body">${escHtml(m.body as string)}</div><div class="mc-foot"><span>${escHtml(m.date as string)}</span></div></div>`,
      )
      .join("");
  }
}

function applyLogs(root: HTMLElement, d: Record<string, unknown>) {
  const h = d.header as Record<string, unknown> | undefined;
  if (h) {
    setText(root, "[data-cc-live='logs-spend']", `Today: $${h.today} · Month: $${h.month} / $${h.month_limit}`);
    setText(root, "[data-cc-live='logs-count']", `${fmtInt(Number(h.total_entries ?? 0))} total entries`);
  }
  const entries = d.entries as Record<string, unknown>[] | undefined;
  const tb = root.querySelector("[data-cc-live='logs-tbody']");
  if (tb && entries) {
    tb.innerHTML = entries
      .map((e) => {
        const err = e.error ? "rgba(255,61,90,.025)" : "";
        const chip = e.error ? "ch-r" : String(e.status) === "SUCCESS" ? "ch-g" : "ch-c";
        return `<tr data-cc-expand-log="1" style="${err ? `background:${err}` : ""}"><td class="mn">${escHtml(e.time as string)}</td><td class="nm">${escHtml(e.agent as string)}</td><td><span class="tag tag-c" style="font-size:9px">${escHtml(e.product as string)}</span></td><td><span class="chip ch-n" style="font-size:7px">${escHtml(e.type as string)}</span></td><td><span class="chip ${chip}" style="font-size:7px">${escHtml(e.status as string)}</span></td><td class="mn">${escHtml(e.duration as string)}</td><td class="mn">${escHtml(e.records as string)}</td><td class="mn" style="color:var(--green)">$${e.cost}</td><td style="font-size:11px;color:var(--t3)">${escHtml(e.summary as string)}</td><td><button type="button" class="btn btn-ghost btn-xs">▼</button></td></tr>`;
      })
      .join("");
  }
}

function applyStandups(root: HTMLElement, d: Record<string, unknown>) {
  const label = root.querySelector("[data-cc-live='standups-date']");
  if (label) label.textContent = String(d.date_label ?? "");
  const cards = d.cards as Record<string, unknown>[] | undefined;
  const grid = root.querySelector("[data-cc-live='standups-grid']");
  if (grid && cards?.length) {
    grid.innerHTML = cards
      .map(
        (c) =>
          `<div class="std-card"><div class="std-accent" style="background:var(--cyan)"></div><div class="std-head"><div class="std-agent"><span style="color:var(--cyan);font-size:16px">◇</span><div><div class="std-name">${escHtml(c.name as string)}</div><div class="std-sub">${escHtml(c.date as string)}</div></div></div><span class="chip ch-a" style="font-size:7px">LOG</span></div><div class="std-lbl">Plan</div><div class="std-text">${escHtml(c.plan as string)}</div><div class="std-div"></div><div class="std-lbl">Actuals</div><div class="std-text">${escHtml((c.actual as string) || "—")}</div></div>`,
      )
      .join("");
  }
}

function applyAgents(root: HTMLElement, d: Record<string, unknown>) {
  const builtin = d.builtin as Record<string, unknown>[] | undefined;
  const host = root.querySelector("[data-cc-live='agents-builtin']");
  if (host && builtin?.length) {
    host.innerHTML = builtin
      .map((a) => {
        const dotRun =
          a.dot_class === "run"
            ? " run"
            : "";
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
            ? `<span class="dot"></span>${escHtml(a.chip_label as string)}`
            : escHtml(a.chip_label as string);
        const slug = (a.agent_type as string) || "";
        return `<div class="panel" style="border-left:3px solid var(--cyan)"><div class="panel-hdr"><div style="display:flex;align-items:center;gap:8px"><div class="ar-dot${dotRun}" style="background:${dotBg}"></div><span style="font-size:14px;font-weight:600;color:var(--t1)">${escHtml(a.display_name as string)}</span></div><span class="chip ${a.chip_class}">${chipInner}</span></div><div class="panel-body"><div style="font-size:11px;color:var(--t2);margin-bottom:10px">${escHtml(a.subtitle as string)}</div><div style="display:flex;gap:14px;margin-bottom:10px"><span style="font-family:var(--fm);font-size:9px;color:var(--t3)">Mem: <span style="color:var(--purple)">${a.mem_count ?? 0}</span></span></div><div style="display:flex;gap:5px"><button type="button" class="btn btn-ghost btn-xs" data-cc-nav="logs">LOGS</button><button type="button" class="btn btn-ghost btn-xs" data-cc-nav="memory">MEMORY</button><button type="button" class="btn btn-c btn-xs" style="margin-left:auto" data-cc-run-agent="${slug}">▶ RUN NOW</button></div></div></div>`;
      })
      .join("");
  }
  const custom = d.custom as Record<string, unknown>[] | undefined;
  const ch = root.querySelector("[data-cc-live='agents-custom']");
  if (ch && custom?.length) {
    ch.innerHTML = custom
      .map(
        (c) =>
          `<div class="panel"><div class="panel-hdr">${escHtml(c.name as string)}</div><div class="panel-body"><span style="font-size:11px;color:var(--t3)">Custom agent · use Agent Builder</span></div></div>`,
      )
      .join("");
  }
}

function applyScheduler(root: HTMLElement, d: Record<string, unknown>) {
  const rows = d.schedules as Record<string, unknown>[] | undefined;
  const tb = root.querySelector("[data-cc-live='scheduler-tbody']");
  if (tb && rows?.length) {
    tb.innerHTML = rows
      .map(
        (r) =>
          `<tr><td class="nm">${escHtml(r.agent as string)}</td><td class="mn" style="color:var(--cyan)">gpt-4o-mini</td><td class="mn" colspan="3"><code style="font-size:10px">${escHtml(r.cron as string)}</code> · ${escHtml(r.product as string)}</td><td class="mn">${escHtml(r.next as string)}</td><td class="mn">—</td><td><span class="chip ch-g" style="font-size:7px">ACTIVE</span></td></tr>`,
      )
      .join("");
  } else if (tb && (!rows || rows.length === 0)) {
    tb.innerHTML = `<tr><td colspan="8" class="mn" style="padding:16px;color:var(--t3)">No schedules yet. Create one from Agents → Custom Agent Builder (scheduled), or insert into agent_schedules.</td></tr>`;
  }
}

function applyProducts(root: HTMLElement, d: Record<string, unknown>) {
  const products = d.products as Record<string, unknown>[] | undefined;
  const grid = root.querySelector("[data-cc-live='products-grid']");
  if (grid && products) {
    const cards = products
      .map(
        (p) =>
          `<div class="prod-card"><div class="pc-top"><div class="pc-logo" style="background:var(--cyan3);color:var(--bg)">${escHtml(p.initials as string)}</div><div class="pc-info"><div class="pc-name">${escHtml(p.name as string)}</div><div class="pc-desc">${escHtml(p.slug as string)}</div></div><span class="chip ch-g">ACTIVE</span></div><div class="pc-stats"><div class="pc-stat">Leads: <span>${p.leads}</span></div><div class="pc-stat">Sent: <span>${p.emails}</span></div><div class="pc-stat">Posts: <span>${p.posts}</span></div></div><div class="pc-foot"><button type="button" class="btn btn-ghost btn-xs" data-cc-product-edit="${escHtml(p.id as string)}">EDIT</button><button type="button" class="btn btn-ghost btn-xs" data-cc-nav="branding">BRANDING</button><button type="button" class="btn btn-ghost btn-xs" data-cc-nav="seo">SEO</button></div></div>`,
      )
      .join("");
    grid.innerHTML =
      cards +
      `<div style="background:var(--surface);border:2px dashed var(--b2);border-radius:var(--r);display:flex;align-items:center;justify-content:center;min-height:110px;cursor:pointer" data-cc-modal="add-product"><div style="text-align:center;color:var(--t3)"><div style="font-size:26px;margin-bottom:7px">+</div><div style="font-size:13px">Add New Product</div></div></div>`;
  }
}

function applyBranding(root: HTMLElement, d: Record<string, unknown>) {
  setText(root, "[data-cc-live='brand-page-title']", String(d.title ?? ""));
  const b = d.branding as Record<string, unknown> | null | undefined;
  if (b) {
    const setInp = (sel: string, val: string) => {
      const el = root.querySelector<HTMLInputElement>(sel);
      if (el) el.value = val;
    };
    setInp("[data-cc-live='brand-primary']", String(b.primary_color ?? ""));
    setInp("[data-cc-live='brand-secondary']", String(b.secondary_color ?? ""));
    setInp("[data-cc-live='brand-bg']", String(b.background_color ?? ""));
    setInp("[data-cc-live='brand-text']", String(b.text_color ?? ""));
    setInp("[data-cc-live='brand-company']", String(b.footer_company_name ?? ""));
    setInp("[data-cc-live='brand-address']", String(b.footer_address ?? ""));
    setInp("[data-cc-live='brand-sig']", String(b.email_signature ?? ""));
    setInp("[data-cc-live='brand-prefix']", String(b.preview_text_prefix ?? ""));
  }
}

function applyUsers(root: HTMLElement, d: Record<string, unknown>) {
  setText(root, "[data-cc-live='users-seat']", String(d.seat_label ?? ""));
  const users = d.users as Record<string, unknown>[] | undefined;
  const host = root.querySelector("[data-cc-live='users-list']");
  if (host && users) {
    host.innerHTML = users
      .map(
        (u) =>
          `<div class="user-row"><div class="user-av" style="background:linear-gradient(135deg,var(--surface3),var(--cyan3));color:var(--t1)">${escHtml(u.av as string)}</div><div class="user-info"><div class="user-name">${escHtml(u.name as string)}</div><div class="user-email">${escHtml(u.email as string)}</div></div><span class="role-badge rb-admin">${escHtml(u.role as string)}</span></div>`,
      )
      .join("");
  }
}

function applySettings(root: HTMLElement, d: Record<string, unknown>) {
  const orgInp = root.querySelector<HTMLInputElement>(
    "[data-cc-live='set-org']",
  );
  if (orgInp) orgInp.value = String(d.org_name ?? "");
  const wh = root.querySelector<HTMLInputElement>("[data-cc-live='set-webhook']");
  if (wh) wh.value = String(d.webhook_url ?? "");
  const dl = root.querySelector<HTMLInputElement>("[data-cc-live='set-daily']");
  if (dl) dl.value = String(d.daily_limit ?? "");
  const ml = root.querySelector<HTMLInputElement>("[data-cc-live='set-monthly']");
  if (ml) ml.value = String(d.monthly_limit ?? "");
  setText(
    root,
    "[data-cc-live='set-spend-line']",
    `Today: $${d.spend_today} / $${d.daily_limit} · Month: $${d.spend_month} / $${d.monthly_limit}`,
  );
  const oai = root.querySelector("[data-cc-live='set-openai']");
  if (oai)
    oai.textContent = d.openai_configured
      ? "Configured on server (OPENAI_API_KEY)"
      : "Not set — add OPENAI_API_KEY";
}

function applyBilling(root: HTMLElement, d: Record<string, unknown>) {
  setText(root, '[data-cc-kpi="bill_plan"]', String(d.plan ?? ""));
  setText(root, '[data-cc-kpi="bill_spend"]', `$${d.month_spend ?? "0"}`);
}

function applySuperAdmin(root: HTMLElement, d: Record<string, unknown>) {
  if (d.access === "org_only") {
    const g = root.querySelector("[data-cc-live='super-grid']");
    if (g)
      g.innerHTML = `<div class="info-box" style="grid-column:1/-1">Super Admin view is limited to users with the <code>super_admin</code> role in Supabase.</div>`;
    return;
  }
  if (d.access === "full") {
    setText(root, '[data-cc-kpi="sa_tenants"]', fmtInt(Number(d.tenant_count ?? 0)));
    setText(root, '[data-cc-kpi="sa_err"]', fmtInt(Number(d.error_week ?? 0)));
    const orgs = d.organisations as Record<string, unknown>[] | undefined;
    const host = root.querySelector("[data-cc-live='super-orgs']");
    if (host && orgs) {
      host.innerHTML = orgs
        .map((o) => {
          const nm = escHtml(o.name as string);
          const ini = nm.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "OR";
          return `<div class="org-row"><div class="org-logo" style="background:var(--b2);color:var(--t1)">${ini}</div><div style="flex:1"><div class="org-name">${nm}</div><div class="org-sub">${escHtml(o.plan as string)}</div></div></div>`;
        })
        .join("");
    }
  }
}
