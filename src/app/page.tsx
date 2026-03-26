import { Inter, JetBrains_Mono } from "next/font/google";
import { SignInForm } from "@/components/sign-in-form";
import { isUiPreviewMode } from "@/lib/ui-preview";
import styles from "./login.module.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-login-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-login-mono",
  display: "swap",
});

type Props = { searchParams: Promise<{ needs?: string }> };

export default async function Home({ searchParams }: Props) {
  const preview = isUiPreviewMode();
  const needs = (await searchParams).needs;

  return (
    <div
      className={`${inter.variable} ${jetbrainsMono.variable} ${styles.loginPage}`}
    >
      <div className={styles.page}>
        <aside className={styles.leftPanel} aria-label="Product overview">
          <p className={styles.wordmark}>
            <span className={`app-logo ${styles.wordmarkText}`} translate="no">
              OpSync
            </span>
          </p>

          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} aria-hidden />
            Marketing Ops Platform
          </div>

          <h1 className={styles.heroTitle}>
            Automated
            <br />
            <em>marketing operations</em>
            <br />
            at scale
          </h1>

          <p className={styles.heroSub}>
            Internal CRM powered by Supabase — orchestrate agents, run drip sequences, and manage
            approval workflows in one unified cockpit.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={`${styles.featureIcon} ${styles.featureIconGreen}`} aria-hidden>
                🤖
              </div>
              <div className={styles.featureText}>
                <h4>AI Agents</h4>
                <p>Delegate prospecting, enrichment, and outreach to autonomous agents.</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={`${styles.featureIcon} ${styles.featureIconBlue}`} aria-hidden>
                📧
              </div>
              <div className={styles.featureText}>
                <h4>Sequences &amp; Drips</h4>
                <p>Visual sequence builder with conditional branches and A/B testing.</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={`${styles.featureIcon} ${styles.featureIconAmber}`} aria-hidden>
                ✅
              </div>
              <div className={styles.featureText}>
                <h4>Approval Flows</h4>
                <p>Route copy, budgets, and campaigns through structured approvals.</p>
              </div>
            </div>
          </div>

          <div className={styles.socialProof}>
            <div className={styles.avatars} aria-hidden>
              <div className={styles.avatar}>A</div>
              <div className={styles.avatar}>M</div>
              <div className={styles.avatar}>R</div>
              <div className={styles.avatar}>J</div>
            </div>
            <span className={styles.socialText}>
              <strong>Marketing &amp; revops</strong> — agents, sequences, and approvals in one cockpit
            </span>
          </div>
        </aside>

        <main className={styles.rightPanel}>
          <SignInForm
            showPreviewHint={preview}
            uiPreviewEnabled={preview}
            needsBackend={needs === "backend"}
          />
        </main>
      </div>
    </div>
  );
}
