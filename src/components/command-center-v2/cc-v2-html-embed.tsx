"use client";

import { useCcV2Modal } from "@/components/command-center-v2/cc-v2-modals";
import { applyCommandCenterPageData } from "@/lib/command-center/apply-page-html";
import { isCommandCenterPage } from "@/lib/command-center/page-types";
import { applyDashboardLiveData } from "@/lib/dashboard/apply-live-html";
import type { DashboardSummaryJson } from "@/lib/dashboard/build-summary";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_MAP: Record<string, string> = {
  dashboard: "/dashboard",
  leads: "/leads",
  campaigns: "/campaigns",
  emailpreview: "/email-preview",
  followups: "/follow-ups",
  blog: "/blog",
  seo: "/seo",
  intelligence: "/intelligence",
  memory: "/memory",
  logs: "/agent-logs",
  standups: "/standups",
  agents: "/agents",
  scheduler: "/scheduler",
  products: "/products",
  branding: "/branding",
  users: "/users",
  settings: "/settings",
  billing: "/billing",
  superadmin: "/super-admin",
};

function rewriteMockupHtml(fragment: string) {
  let h = fragment;
  h = h.replace(
    /onclick="nav\('([^']+)'\);closeModal\('[^']+'\)"/g,
    'data-cc-nav="$1" data-cc-close-modal role="link" tabindex="0"',
  );
  h = h.replace(/onclick="nav\('([^']+)'\)"/g, 'data-cc-nav="$1" role="link" tabindex="0"');
  h = h.replace(/onclick="openModal\('([^']+)'\)"/g, (_, raw: string) => {
    const key = raw.startsWith("modal-") ? raw.slice("modal-".length) : raw;
    return `data-cc-modal="${key}"`;
  });
  h = h.replace(/onclick="closeModal\([^)]*\)"/g, "data-cc-close-modal");
  h = h.replace(/onclick="expandLog\(this\)"/g, 'data-cc-expand-log="1"');
  h = h.replace(/onclick="setView\('desktop'\)"/g, 'data-cc-ep-view="desktop"');
  h = h.replace(/onclick="setView\('mobile'\)"/g, 'data-cc-ep-view="mobile"');
  h = h.replace(/onclick="toggleDark\(\)"/g, 'data-cc-ep-dark="1"');
  return h;
}

function applyEpLayout(root: HTMLElement, view: "desktop" | "mobile") {
  const c = root.querySelector<HTMLElement>("#ep-container");
  const btnDesk = root.querySelector<HTMLElement>("#btn-desk");
  const btnMob = root.querySelector<HTMLElement>("#btn-mob");
  if (c) c.style.width = view === "mobile" ? "375px" : "600px";
  [btnDesk, btnMob].forEach((b) => {
    if (b) {
      b.style.color = "";
      b.style.borderColor = "";
    }
  });
  const active = view === "desktop" ? btnDesk : btnMob;
  if (active) {
    active.style.color = "var(--cyan)";
    active.style.borderColor = "var(--cyan)";
  }
}

export type CcV2PageKey =
  | "dashboard"
  | "leads"
  | "campaigns"
  | "emailpreview"
  | "followups"
  | "blog"
  | "seo"
  | "intelligence"
  | "memory"
  | "logs"
  | "standups"
  | "agents"
  | "scheduler"
  | "products"
  | "branding"
  | "users"
  | "settings"
  | "billing"
  | "superadmin";

export function CcV2HtmlEmbed({
  pageId,
  useLiveData = false,
}: {
  pageId: CcV2PageKey;
  useLiveData?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { openModal, closeModal } = useCcV2Modal();
  const [epDark, setEpDark] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    let cancelled = false;

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;

      const runAllEl = t.closest("[data-cc-run-all-agents]");
      if (runAllEl && pageId === "dashboard") {
        e.preventDefault();
        const btn = runAllEl as HTMLButtonElement;
        const prevText = btn.textContent;
        const prevDisabled = btn.disabled;
        btn.disabled = true;
        btn.textContent = "RUNNING…";
        void (async () => {
          const mountEl = ref.current;
          try {
            const res = await fetch("/api/agents/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ run_all: true }),
              credentials: "same-origin",
            });
            let data: { error?: string; results?: { ok: boolean; agent_type: string; error?: string }[] } =
              {};
            try {
              data = (await res.json()) as typeof data;
            } catch {
              /* ignore */
            }
            if (!res.ok) {
              window.alert(data.error ?? `Request failed (${res.status})`);
              return;
            }
            const lines = (data.results ?? []).map((r) =>
              r.ok ? `✓ ${r.agent_type}` : `✗ ${r.agent_type}: ${r.error ?? "error"}`,
            );
            window.alert(lines.length ? lines.join("\n") : "Done.");
            if (useLiveData && mountEl && pageId === "dashboard") {
              const s = await fetch("/api/dashboard/summary", { credentials: "same-origin" });
              if (s.ok) {
                const j = (await s.json()) as DashboardSummaryJson;
                applyDashboardLiveData(mountEl, j);
              }
            }
          } catch (err) {
            window.alert(err instanceof Error ? err.message : "Network error");
          } finally {
            btn.disabled = prevDisabled;
            if (prevText) btn.textContent = prevText;
          }
        })();
        return;
      }

      const runAgentEl = t.closest("[data-cc-run-agent]");
      if (runAgentEl) {
        e.preventDefault();
        const agentType = runAgentEl.getAttribute("data-cc-run-agent")?.trim();
        if (!agentType) return;
        const btn = runAgentEl as HTMLButtonElement;
        const prevText = btn.textContent;
        const prevDisabled = btn.disabled;
        btn.disabled = true;
        btn.textContent = "RUNNING…";
        void (async () => {
          try {
            const res = await fetch("/api/agents/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agent_type: agentType }),
              credentials: "same-origin",
            });
            let data: {
              error?: string;
              results?: { ok: boolean; agent_type: string; error?: string }[];
            } = {};
            try {
              data = (await res.json()) as typeof data;
            } catch {
              /* ignore */
            }
            if (!res.ok) {
              window.alert(data.error ?? `Request failed (${res.status})`);
              return;
            }
            const r0 = data.results?.[0];
            window.alert(
              r0
                ? r0.ok
                  ? `✓ ${r0.agent_type}`
                  : `✗ ${r0.agent_type}: ${r0.error ?? "error"}`
                : "Done.",
            );
          } catch (err) {
            window.alert(err instanceof Error ? err.message : "Network error");
          } finally {
            btn.disabled = prevDisabled;
            if (prevText) btn.textContent = prevText;
          }
        })();
        return;
      }

      const prodEdit = t.closest("[data-cc-product-edit]");
      if (prodEdit) {
        e.preventDefault();
        const id = prodEdit.getAttribute("data-cc-product-edit")?.trim();
        if (id) router.push(`/products/${id}`);
        return;
      }

      const navEl0 = t.closest("[data-cc-nav]");
      if (navEl0?.hasAttribute("data-cc-close-modal")) {
        e.preventDefault();
        closeModal();
        const id = navEl0.getAttribute("data-cc-nav");
        if (id && NAV_MAP[id]) router.push(NAV_MAP[id]);
        return;
      }

      if (t.closest("[data-cc-close-modal]")) {
        e.preventDefault();
        closeModal();
        return;
      }

      const navEl = t.closest("[data-cc-nav]");
      if (navEl) {
        const id = navEl.getAttribute("data-cc-nav");
        if (id && NAV_MAP[id]) {
          e.preventDefault();
          router.push(NAV_MAP[id]);
        }
        return;
      }

      const modalEl = t.closest("[data-cc-modal]");
      if (modalEl) {
        const id = modalEl.getAttribute("data-cc-modal");
        const allowed = [
          "lead-detail",
          "add-product",
          "invite",
          "agent-builder",
          "notif",
          "profile",
        ] as const;
        if (id && allowed.includes(id as (typeof allowed)[number])) {
          e.preventDefault();
          openModal(id as (typeof allowed)[number]);
        }
        return;
      }

      const row = t.closest("tr[data-cc-expand-log]");
      if (row) {
        e.preventDefault();
        const tr = row as HTMLTableRowElement;
        const parent = tr.parentElement;
        if (!parent) return;
        const next = tr.nextElementSibling as HTMLElement | null;
        if (next?.classList.contains("log-exp")) {
          next.remove();
          return;
        }
        const isErr = tr.style.background.includes("255,61,90");
        const cells = tr.cells;
        const summary = cells[8] ? cells[8].textContent : "";
        const d = document.createElement("tr");
        d.className = "log-exp";
        d.innerHTML = `<td colspan="10" style="background:var(--bg);padding:10px 14px;border-bottom:1px solid var(--b1)">
    <div style="font-family:var(--fm);font-size:8px;letter-spacing:.1em;color:var(--t4);margin-bottom:6px">// RUN DETAIL</div>
    ${isErr ? `<div style="padding:8px 10px;background:var(--red-a10);border:1px solid var(--red-a20);border-radius:var(--r);font-family:var(--fm);font-size:10px;color:var(--red);margin-bottom:8px">ERROR: GitHub API authentication token expired — renew GITHUB_TOKEN in Vercel Environment Variables</div>` : `<div style="font-size:11px;color:var(--t2);margin-bottom:8px">${summary || "Completed successfully."}</div>`}
    <div style="display:flex;gap:6px"><button type="button" class="btn btn-c btn-xs">▶ RE-RUN</button><button type="button" class="btn btn-ghost btn-xs">VIEW FULL JSON</button><button type="button" class="btn btn-ghost btn-xs">COPY RUN ID</button></div>
  </td>`;
        parent.insertBefore(d, tr.nextSibling);
        return;
      }

      const vEl = t.closest<HTMLElement>("[data-cc-ep-view]");
      const v = vEl?.dataset.ccEpView;
      if (v === "desktop" || v === "mobile") {
        e.preventDefault();
        applyEpLayout(target, v);
        return;
      }

      if (t.closest("[data-cc-ep-dark]")) {
        e.preventDefault();
        setEpDark((d) => !d);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const navEl = (e.target as HTMLElement)?.closest?.("[data-cc-nav]");
      if (navEl && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        const id = navEl.getAttribute("data-cc-nav");
        if (id && NAV_MAP[id]) router.push(NAV_MAP[id]);
      }
    };

    (async () => {
      const res = await fetch("/commandcenter-v2.html", { cache: "no-store" });
      const html = await res.text();
      if (cancelled || !ref.current) return;
      const doc = new DOMParser().parseFromString(html, "text/html");
      const el = doc.getElementById(`pg-${pageId}`);
      if (!el || cancelled || !ref.current) return;
      const mount = ref.current;
      mount.innerHTML = rewriteMockupHtml(el.innerHTML);

      if (pageId === "emailpreview") {
        applyEpLayout(mount, "desktop");
      }

      if (pageId === "dashboard" && useLiveData && !cancelled) {
        try {
          const s = await fetch("/api/dashboard/summary", { credentials: "same-origin" });
          if (s.ok && !cancelled && ref.current === mount) {
            const j = (await s.json()) as DashboardSummaryJson;
            applyDashboardLiveData(mount, j);
          }
        } catch {
          /* keep static fallback */
        }
      }

      if (
        useLiveData &&
        !cancelled &&
        pageId !== "dashboard" &&
        isCommandCenterPage(pageId)
      ) {
        try {
          const p = await fetch(
            `/api/command-center/page-data?page=${encodeURIComponent(pageId)}`,
            { credentials: "same-origin" },
          );
          if (p.ok && !cancelled && ref.current === mount) {
            const body = (await p.json()) as {
              data?: Record<string, unknown>;
            };
            if (body.data) {
              applyCommandCenterPageData(mount, pageId, body.data);
            }
          }
        } catch {
          /* keep static fallback */
        }
      }

      if (cancelled) return;
      mount.addEventListener("click", onClick);
      mount.addEventListener("keydown", onKeyDown);
    })();

    return () => {
      cancelled = true;
      target.removeEventListener("click", onClick);
      target.removeEventListener("keydown", onKeyDown);
      target.innerHTML = "";
    };
  }, [closeModal, openModal, pageId, router, useLiveData]);

  useEffect(() => {
    const root = ref.current;
    if (!root || pageId !== "emailpreview") return;
    const body = root.querySelector<HTMLElement>("#ep-email-body");
    const btnDark = root.querySelector<HTMLElement>("#btn-dark");
    if (body) body.style.filter = epDark ? "invert(1) hue-rotate(180deg)" : "";
    if (btnDark) {
      btnDark.style.color = epDark ? "var(--cyan)" : "";
      btnDark.style.borderColor = epDark ? "var(--cyan)" : "";
    }
  }, [epDark, pageId]);

  return <div ref={ref} className="cc-v2-page cc-v2-html-root" />;
}
