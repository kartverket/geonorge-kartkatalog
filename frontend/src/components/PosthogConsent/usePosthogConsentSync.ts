"use client";

import { useConsentCategory } from "@cookieyes/nextjs";
import { useEffect } from "react";
import { syncAnalyticsConsent } from "./posthogConsent";

export function usePosthogConsentSync() {
  const hasAnalyticsConsent = useConsentCategory("analytics");

  useEffect(() => {
    syncAnalyticsConsent(hasAnalyticsConsent);
  }, [hasAnalyticsConsent]);
}
