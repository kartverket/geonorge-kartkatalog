export type ViewMode = "grid" | "list";
export const VIEW_MODE_COOKIE_NAME = "search-results-view-mode";
export function isViewMode(
  value: string | null | undefined,
): value is ViewMode {
  return value === "grid" || value === "list";
}
