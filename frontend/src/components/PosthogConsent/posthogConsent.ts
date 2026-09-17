import posthog from "posthog-js";

const POSTHOG_OPT_IN_SETTINGS = {
  autocapture: true,
  capture_pageview: true,
  capture_pageleave: true,
  enable_heatmaps: true,
} as const;

const POSTHOG_OPT_OUT_SETTINGS = {
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,
  enable_heatmaps: false,
} as const;

type PostHogOptIn = (typeof posthog.opt_in_capturing extends (
  ...args: infer Args
) => infer Return
  ? (...args: Args) => Return
  : never) &
  ((settings: typeof POSTHOG_OPT_IN_SETTINGS) => void);

type PostHogOptOut = (typeof posthog.opt_out_capturing extends (
  ...args: infer Args
) => infer Return
  ? (...args: Args) => Return
  : never) &
  ((settings: typeof POSTHOG_OPT_OUT_SETTINGS) => void);

let analyticsConsent = false;
let hasInitializedPosthog = false;

function setPosthogTrackingEnabled(enabled: boolean): void {
  if (enabled) {
    (posthog.opt_in_capturing as unknown as PostHogOptIn)(
      POSTHOG_OPT_IN_SETTINGS,
    );
    return;
  }

  (posthog.opt_out_capturing as unknown as PostHogOptOut)(
    POSTHOG_OPT_OUT_SETTINGS,
  );
}

export function canTrackAnalytics(): boolean {
  return analyticsConsent;
}

export function syncAnalyticsConsent(hasAnalyticsConsent: boolean): void {
  analyticsConsent = hasAnalyticsConsent;

  if (hasInitializedPosthog) {
    setPosthogTrackingEnabled(hasAnalyticsConsent);
  }
}

export function markPosthogInitialized(): void {
  hasInitializedPosthog = true;
  setPosthogTrackingEnabled(analyticsConsent);
}
