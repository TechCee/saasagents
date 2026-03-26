import { NextResponse, type NextRequest } from "next/server";
import { buildCommandCenterPageData } from "@/lib/command-center/build-page-data";
import { isCommandCenterPage } from "@/lib/command-center/page-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUiPreviewMode } from "@/lib/ui-preview";

export async function GET(req: NextRequest) {
  if (isUiPreviewMode()) {
    return NextResponse.json(
      { error: "Live data requires UI_PREVIEW_MODE=false" },
      { status: 403 },
    );
  }

  const page = req.nextUrl.searchParams.get("page") ?? "";
  if (!isCommandCenterPage(page)) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    req.nextUrl.origin;
  const payload = await buildCommandCenterPageData(supabase, page, {
    appUrl,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
  });
  return NextResponse.json({ page, data: payload });
}
