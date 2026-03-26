export const COMMAND_CENTER_PAGES = [
  "leads",
  "campaigns",
  "emailpreview",
  "followups",
  "blog",
  "seo",
  "intelligence",
  "memory",
  "logs",
  "standups",
  "agents",
  "scheduler",
  "products",
  "branding",
  "users",
  "settings",
  "billing",
  "superadmin",
] as const;

export type CommandCenterPage = (typeof COMMAND_CENTER_PAGES)[number];

export function isCommandCenterPage(p: string): p is CommandCenterPage {
  return (COMMAND_CENTER_PAGES as readonly string[]).includes(p);
}
