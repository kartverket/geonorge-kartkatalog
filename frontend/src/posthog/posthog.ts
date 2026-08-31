import posthog from "posthog-js";

export const LOCATIONS = {
  Header: "header",
  HeaderMenu: "header-menu",
  HeaderDropdown: "header-dropdown",
  HeaderProfile: "header-profile",
  SearchHero: "search-hero",
  SearchPage: "search-page",
  MetadataPage: "metadata-page",
  MetadataPageTabs: "metadata-page-tabs",
  MetadataPageLinkedDistributions: "metadata-page-linked-distributions",
  MetadataPageError: "metadata-page-error",
} as const;

export type Location = (typeof LOCATIONS)[keyof typeof LOCATIONS];
export type AnalyticsProperties = Record<string, unknown> & {
  location: Location;
};
type ClickAnalyticsProperties = Omit<AnalyticsProperties, "location">;

export function trackEvent(
  eventName: string,
  properties?: AnalyticsProperties,
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[PostHog] ${eventName}`, properties);
    return;
  }

  posthog.capture(eventName, properties);
}

export function trackClick(
  clickItem: string,
  location: Location,
  properties?: ClickAnalyticsProperties,
): void {
  trackEvent(`${clickItem}-clicked`, { location, ...properties });
}
