import posthog from "posthog-js";

export type AnalyticsProperties = Record<string, unknown>;

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
