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

  // #region agent log
  fetch('http://127.0.0.1:7670/ingest/edda1648-0366-438c-9621-378fb5e6374b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95d6c6'},body:JSON.stringify({sessionId:'95d6c6',runId:'pre-fix',hypothesisId:'H_wrong_mode_or_cache',location:'src/app/api/dashboard/summary/route.ts:28',message:'dashboard summary requested',data:{uiPreview:Boolean(isUiPreviewMode()),hasUser:true},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log

  const summary = await buildDashboardSummary(supabase);
  return NextResponse.json(summary);
}
