import posthog from "posthog-js";

export const LOCATIONS = {
  Header: 'header',
  HeaderMenu: 'header-menu'

} as const

export type Location = (typeof LOCATIONS)[keyof typeof LOCATIONS];
export type AnalyticsProperties = Record<string, unknown> & {
  location: Location;
};

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
