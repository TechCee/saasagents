"use client";

import { useCcV2Modal } from "@/components/command-center-v2/cc-v2-modals";
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

export function CcV2HtmlEmbed({ pageId }: { pageId: CcV2PageKey }) {
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
  }, [closeModal, openModal, pageId, router]);

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
