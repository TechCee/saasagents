/**
 * Local / staging only: browse the OpSync shell and dashboard with sample data,
 * without Supabase or sign-in. Never enable in production.
 */
export function isUiPreviewMode(): boolean {
  return process.env.UI_PREVIEW_MODE === "true";
}
