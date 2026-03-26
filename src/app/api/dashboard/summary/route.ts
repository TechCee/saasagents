import { NextResponse } from "next/server";
import { buildDashboardSummary } from "@/lib/dashboard/build-summary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUiPreviewMode } from "@/lib/ui-preview";

/**
 * Org-scoped dashboard aggregates for live UI (RLS via session).
 */
export async function GET() {
  if (isUiPreviewMode()) {
    return NextResponse.json(
      { error: "Live dashboard data requires UI_PREVIEW_MODE=false" },
      { status: 403 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await buildDashboardSummary(supabase);
  return NextResponse.json(summary);
}
