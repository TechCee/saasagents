import { CcV2HtmlEmbed } from "@/components/command-center-v2/cc-v2-html-embed";
import type { CcV2PageKey } from "@/components/command-center-v2/cc-v2-html-embed";
import { isUiPreviewMode } from "@/lib/ui-preview";

/** HTML embed route with live Supabase hydration when not in UI preview mode. */
export function CcV2Page({ pageId }: { pageId: CcV2PageKey }) {
  return <CcV2HtmlEmbed pageId={pageId} useLiveData={!isUiPreviewMode()} />;
}
