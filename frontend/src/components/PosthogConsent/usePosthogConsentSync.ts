"use client";

import { useConsent, useConsentCategory } from "@cookieyes/nextjs";
import { useEffect } from "react";
import { syncAnalyticsConsent } from "./posthogConsent";

export function usePosthogConsentSync() {
  const consent = useConsent();
  const hasAnalyticsConsent = useConsentCategory("analytics");

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[CookieYes] Consent snapshot", consent);
    }

    syncAnalyticsConsent(hasAnalyticsConsent);
  }, [consent, hasAnalyticsConsent]);
}
