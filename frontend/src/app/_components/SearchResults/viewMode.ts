export type ViewMode = "grid" | "list";

export const VIEW_MODE_COOKIE_NAME = "search-results-view-mode";

export function isViewMode(
  value: string | null | undefined,
): value is ViewMode {
  return value === "grid" || value === "list";
}

export function getViewModeFromCookieString(
  cookieString: string,
): ViewMode | null {
  const cookieValue = cookieString
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${VIEW_MODE_COOKIE_NAME}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  return isViewMode(cookieValue) ? cookieValue : null;
}
