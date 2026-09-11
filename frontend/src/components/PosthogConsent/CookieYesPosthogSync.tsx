"use client";

import { useEffect } from "react";
import {
  type ConsentCategories,
  type ConsentState,
  DEFAULT_CONSENT,
  normalizeConsent,
  parseConsentCookieString,
} from "./consentCookie";
import { syncAnalyticsConsent } from "./posthogConsent";

type CookieYesConsentSnapshot = {
  isUserActionCompleted?: boolean;
  categories?: ConsentCategories | null;
} | null;

type CookieYesBannerLoadDetail = {
  categories?: ConsentCategories | null;
} | null;

type CookieYesConsentUpdateDetail = {
  accepted?: ConsentCategories | null;
} | null;

declare global {
  interface Window {
    getCkyConsent?: () => CookieYesConsentSnapshot | null;
  }
}

function readConsentFromCookieYes(): ConsentState {
  if (typeof window !== "undefined" && window.getCkyConsent) {
    const snapshot = window.getCkyConsent();
    if (snapshot?.isUserActionCompleted) {
      return normalizeConsent({ categories: snapshot.categories });
    }
  }

  if (typeof document === "undefined") {
    return { ...DEFAULT_CONSENT };
  }

  return parseConsentCookieString(document.cookie) ?? { ...DEFAULT_CONSENT };
}

function resolveBannerLoadConsent(
  detail: CookieYesBannerLoadDetail,
): ConsentState {
  return normalizeConsent({ categories: detail?.categories });
}

export function CookieYesPosthogSync() {
  useEffect(() => {
    const applyCurrentConsent = () => {
      syncAnalyticsConsent(readConsentFromCookieYes());
    };

    applyCurrentConsent();

    const handleBannerLoad = (event: Event) => {
      const { detail } = event as CustomEvent<CookieYesBannerLoadDetail>;
      syncAnalyticsConsent(resolveBannerLoadConsent(detail));
    };

    const handleConsentUpdate = (event: Event) => {
      const { detail } = event as CustomEvent<CookieYesConsentUpdateDetail>;
      syncAnalyticsConsent(normalizeConsent({ accepted: detail?.accepted }));
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        applyCurrentConsent();
      }
    };

    document.addEventListener(
      "cookieyes_banner_load",
      handleBannerLoad as EventListener,
    );
    document.addEventListener(
      "cookieyes_consent_update",
      handleConsentUpdate as EventListener,
    );
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", applyCurrentConsent);
    window.addEventListener("pageshow", applyCurrentConsent);

    return () => {
      document.removeEventListener(
        "cookieyes_banner_load",
        handleBannerLoad as EventListener,
      );
      document.removeEventListener(
        "cookieyes_consent_update",
        handleConsentUpdate as EventListener,
      );
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", applyCurrentConsent);
      window.removeEventListener("pageshow", applyCurrentConsent);
    };
  }, []);

  return null;
}
