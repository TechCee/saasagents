"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Link from "next/link";

export type CcV2ModalId =
  | "lead-detail"
  | "add-product"
  | "invite"
  | "agent-builder"
  | "notif"
  | "profile"
  | null;

export type CcV2ModalApi = {
  openModal: (id: Exclude<CcV2ModalId, null>) => void;
  closeModal: () => void;
};

const ModalCtx = createContext<CcV2ModalApi | null>(null);

export function useCcV2Modal() {
  const v = useContext(ModalCtx);
  if (!v) throw new Error("useCcV2Modal must be used within CcV2ModalProvider");
  return v;
}

function overlayClick(e: React.MouseEvent, close: () => void) {
  if (e.target === e.currentTarget) close();
}

export function CcV2ModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<CcV2ModalId>(null);
  const openModal = useCallback((id: Exclude<CcV2ModalId, null>) => setOpen(id), []);
  const closeModal = useCallback(() => setOpen(null), []);
  const api = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  return (
    <ModalCtx.Provider value={api}>
      {children}

        <div
          className={`modal-overlay${open === "lead-detail" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal">
            <div className="modal-hdr">
              <span className="modal-title">Sarah Mitchell — CISO · Accenture</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="g2" style={{ marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)", marginBottom: 4 }}>
                    LEAD SCORE
                  </div>
                  <div style={{ fontFamily: "var(--fm)", fontSize: 32, fontWeight: 700, color: "var(--green)" }}>
                    87
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t3)" }}>
                    Scored 87 because: CISO title matches Trustle ICP, Accenture 200+ employees, corporate email
                    domain. Deducted: not a direct IT tool buyer.
                  </div>
                </div>
                <div>
                  <div className="form-row" style={{ marginBottom: 7 }}>
                    <div className="form-g">
                      <div className="fl">Email</div>
                      <input className="fi" defaultValue="s.mitchell@accenture.com" style={{ fontSize: 11 }} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-g">
                      <div className="fl">Product</div>
                      <select className="fi fs" style={{ fontSize: 11 }}>
                        <option>Trustle</option>
                      </select>
                    </div>
                    <div className="form-g">
                      <div className="fl">Status</div>
                      <select className="fi fs" style={{ fontSize: 11 }}>
                        <option>Contacted</option>
                        <option>New</option>
                        <option>Replied</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sep" />
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)", marginBottom: 8 }}>
                  CONVERSATION THREAD
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: "var(--bg3)", border: "1px solid var(--b1)", borderRadius: "var(--r)", padding: "9px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--fm)", fontSize: 9, fontWeight: 700, color: "var(--cyan)" }}>
                        INITIAL EMAIL
                      </span>
                      <span style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)" }}>18 Mar · 09:12 UTC</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t2)" }}>
                      <b>Sub:</b> How Accenture cut SaaS spend by 34%… — Opened. No reply.
                    </div>
                  </div>
                  <div style={{ background: "var(--bg3)", border: "1px solid var(--b1)", borderRadius: "var(--r)", padding: "9px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--fm)", fontSize: 9, fontWeight: 700, color: "var(--amber)" }}>
                        FOLLOW-UP 1
                      </span>
                      <span style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)" }}>21 Mar · 08:45 UTC</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t2)" }}>
                      <b>Sub:</b> Quick question about your SaaS stack… — Opened × 2. No reply.
                    </div>
                  </div>
                  <div
                    style={{
                      background: "var(--cyan-a05)",
                      border: "1px solid var(--cyan-a20)",
                      borderRadius: "var(--r)",
                      padding: "9px 12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--fm)", fontSize: 9, fontWeight: 700, color: "var(--cyan)" }}>
                        FOLLOW-UP 2 — PENDING APPROVAL
                      </span>
                      <span style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--amber)" }}>Due Today</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t2)" }}>
                      Value-Add tone draft ready. Awaiting Admin approval before send.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CLOSE
              </button>
              <button type="button" className="btn btn-r btn-sm">
                OPT OUT
              </button>
              <Link href="/email-preview" className="btn btn-c btn-sm" onClick={closeModal}>
                VIEW PREVIEW →
              </Link>
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "add-product" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal">
            <div className="modal-hdr">
              <span className="modal-title">Add New Product</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="g2" style={{ marginBottom: 10 }}>
                <div className="form-g">
                  <div className="fl">Product Name</div>
                  <input className="fi" placeholder="e.g. My SaaS Product" />
                </div>
                <div className="form-g">
                  <div className="fl">URL Slug</div>
                  <input className="fi" placeholder="my-saas-product" />
                </div>
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Description</div>
                <textarea className="fta" placeholder="What does this product do? Who is it for?" />
              </div>
              <div className="form-row" style={{ marginBottom: 10 }}>
                <div className="form-g">
                  <div className="fl">Website URL</div>
                  <input className="fi" placeholder="https://yourproduct.io" />
                </div>
                <div className="form-g">
                  <div className="fl">Target Market</div>
                  <select className="fi fs">
                    <option>B2B</option>
                    <option>B2C</option>
                    <option>Both B2B + B2C</option>
                  </select>
                </div>
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Lead Criteria — Target Job Titles (comma separated)</div>
                <input className="fi" placeholder="e.g. IT Manager, CISO, Head of IT, CTO" />
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Blog Topics (comma separated)</div>
                <input className="fi" placeholder="e.g. SaaS security, access management, IT compliance" />
              </div>
              <div className="form-row">
                <div className="form-g">
                  <div className="fl">Writing Tone</div>
                  <select className="fi fs">
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Technical</option>
                    <option>Authoritative</option>
                  </select>
                </div>
                <div className="form-g">
                  <div className="fl">Primary Colour (branding)</div>
                  <input className="fi" placeholder="#1E3A5F" />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CANCEL
              </button>
              <button type="button" className="btn btn-c">
                CREATE PRODUCT →
              </button>
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "invite" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal" style={{ width: 460 }}>
            <div className="modal-hdr">
              <span className="modal-title">Invite Team Member</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Email Address</div>
                <input className="fi" placeholder="colleague@company.com" />
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Full Name</div>
                <input className="fi" placeholder="Their full name" />
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Role</div>
                <select className="fi fs">
                  <option>Viewer — read-only access to all data</option>
                  <option>Admin — full access, can approve and configure</option>
                </select>
              </div>
              <div className="info-box" style={{ fontSize: 11 }}>
                An invitation email will be sent via Resend with a magic link to set their password and access the
                OpSync.
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CANCEL
              </button>
              <button type="button" className="btn btn-c">
                SEND INVITE →
              </button>
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "agent-builder" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal" style={{ width: 660 }}>
            <div className="modal-hdr">
              <span className="modal-title">Custom Agent Builder</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row" style={{ marginBottom: 10 }}>
                <div className="form-g">
                  <div className="fl">Agent Name</div>
                  <input className="fi" placeholder="e.g. Competitor Monitor" />
                </div>
                <div className="form-g">
                  <div className="fl">Output Type</div>
                  <select className="fi fs">
                    <option>Report (saved as Markdown)</option>
                    <option>Lead (written to leads table)</option>
                    <option>Email Draft</option>
                    <option>Blog Draft</option>
                    <option>Notification only</option>
                  </select>
                </div>
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Description (shown in standups)</div>
                <input className="fi" placeholder="What does this agent do?" />
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">System Prompt — Instructions for the Agent</div>
                <textarea
                  className="fta"
                  style={{ minHeight: 110 }}
                  placeholder={
                    "You are a competitor monitor agent. Your job is to...\n\nUse {{product.name}}, {{product.description}}, {{today}} in your prompt."
                  }
                />
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Tool Permissions</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 7 }}>
                  <div className="tog-row">
                    <div className="tog on" />
                    <span>Web Search</span>
                  </div>
                  <div className="tog-row">
                    <div className="tog" />
                    <span>Outbound email (SMTP)</span>
                  </div>
                  <div className="tog-row">
                    <div className="tog" />
                    <span>Internal CRM read (Opsync)</span>
                  </div>
                  <div className="tog-row">
                    <div className="tog on" />
                    <span>Supabase Read</span>
                  </div>
                  <div className="tog-row">
                    <div className="tog" />
                    <span>Supabase Write</span>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-g">
                  <div className="fl">Trigger Type</div>
                  <select className="fi fs">
                    <option>Scheduled (cron)</option>
                    <option>Manual only</option>
                    <option>After another agent completes</option>
                  </select>
                </div>
                <div className="form-g">
                  <div className="fl">Schedule</div>
                  <input className="fi" defaultValue="0 9 * * 1" placeholder="cron expression" />
                </div>
                <div className="form-g">
                  <div className="fl">Model Tier</div>
                  <select className="fi fs">
                    <option>gpt-4o-mini (cheaper)</option>
                    <option>gpt-4o (smarter)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CANCEL
              </button>
              <button type="button" className="btn btn-a btn-sm">
                🧪 TEST RUN
              </button>
              <button type="button" className="btn btn-c">
                CREATE AGENT →
              </button>
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "notif" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div
            className="modal cc-modal-anchor"
            style={{
              width: "min(400px, calc(100vw - 24px))",
              position: "fixed",
              right: "max(12px, env(safe-area-inset-right))",
              top: "max(58px, calc(52px + env(safe-area-inset-top)))",
              margin: 0,
            }}
          >
            <div className="modal-hdr">
              <span className="modal-title">Notifications</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div style={{ padding: 8 }}>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--r)",
                  background: "var(--red-a10)",
                  border: "1px solid var(--red-a20)",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontFamily: "var(--fm)", fontSize: 9, fontWeight: 700, color: "var(--red)", marginBottom: 3 }}>
                  AGENT ERROR · NOW
                </div>
                <div style={{ fontSize: 12, color: "var(--t1)" }}>Developer Agent: GitHub API token expired</div>
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--r)",
                  background: "var(--cyan-a05)",
                  border: "1px solid var(--b1)",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)", marginBottom: 3 }}>APPROVAL NEEDED · 1H AGO</div>
                <div style={{ fontSize: 12, color: "var(--t1)" }}>Email FU-2 batch for Trustle ready to review (14 leads)</div>
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--r)",
                  background: "var(--cyan-a05)",
                  border: "1px solid var(--b1)",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)", marginBottom: 3 }}>APPROVAL NEEDED · 2H AGO</div>
                <div style={{ fontSize: 12, color: "var(--t1)" }}>Blog draft &quot;SaaS Sprawl&quot; (Trustle) ready for review</div>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: "var(--r)", background: "var(--cyan-a05)", border: "1px solid var(--b1)" }}>
                <div style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)", marginBottom: 3 }}>CHANNEL SCOUT · YESTERDAY</div>
                <div style={{ fontSize: 12, color: "var(--t1)" }}>4 warm leads identified — review in Intelligence feed</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "profile" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal" style={{ width: 400 }}>
            <div className="modal-hdr">
              <span className="modal-title">Profile</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 12, color: "var(--t2)" }}>Account settings coming soon.</p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
    </ModalCtx.Provider>
  );
}
