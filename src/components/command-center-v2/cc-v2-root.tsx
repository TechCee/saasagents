"use client";

import { CcV2AppShell } from "./cc-v2-app-shell";
import { CcV2ModalProvider } from "./cc-v2-modals";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "U";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export function CcV2Root({
  children,
  previewBanner,
  userEmail,
  planLabel,
  trialDaysLeft,
}: {
  children: React.ReactNode;
  previewBanner?: React.ReactNode;
  userEmail: string;
  planLabel: string;
  trialDaysLeft: number | null;
}) {
  return (
    <CcV2ModalProvider>
      <CcV2AppShell
        previewBanner={previewBanner}
        userInitials={initialsFromEmail(userEmail)}
        planLabel={planLabel}
        trialDaysLeft={trialDaysLeft}
      >
        {children}
      </CcV2AppShell>
    </CcV2ModalProvider>
  );
}
