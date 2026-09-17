"use client";

import { useConsentCategory } from "@cookieyes/nextjs";
import { useEffect } from "react";
import { syncAnalyticsConsent } from "./posthogConsent";

export function CookieYesPosthogSync() {
  const hasAnalyticsConsent = useConsentCategory("analytics");

  useEffect(() => {
    syncAnalyticsConsent(hasAnalyticsConsent);
  }, [hasAnalyticsConsent]);

  return null;
}
