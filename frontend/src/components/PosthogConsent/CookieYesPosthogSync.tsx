"use client";

import { useEffect } from "react";
import {
  type ConsentState,
  DEFAULT_CONSENT,
  syncAnalyticsConsent,
} from "./posthogConsent";

type CookieYesCategories =
  | Record<string, unknown>
  | string[]
  | null
  | undefined;

type CookieYesConsentSnapshot = {
  isUserActionCompleted?: boolean;
  categories?: CookieYesCategories | null;
} | null;

type CookieYesBannerLoadDetail = {
  categories?: CookieYesCategories | null;
} | null;

type CookieYesConsentUpdateDetail = {
  accepted?: CookieYesCategories | null;
} | null;

const consentCategoryKeys = Object.keys(DEFAULT_CONSENT) as Array<
  keyof ConsentState
>;

function normalizeConsent({
  categories = {},
  accepted,
}: {
  categories?: CookieYesCategories | null;
  accepted?: CookieYesCategories | null;
} = {}): ConsentState {
  const acceptedValues = Array.isArray(accepted) ? accepted : null;
  const categoryValues =
    categories && !Array.isArray(categories) ? categories : null;

  return consentCategoryKeys.reduce<ConsentState>(
    (normalizedConsent, categoryKey) => {
      normalizedConsent[categoryKey] = acceptedValues
        ? acceptedValues.includes(categoryKey)
        : Boolean(categoryValues?.[categoryKey]);

      return normalizedConsent;
    },
    { ...DEFAULT_CONSENT },
  );
}

function readConsentFromCookieYes(): ConsentState {
  if (typeof window === "undefined" || !window.getCkyConsent) {
    return { ...DEFAULT_CONSENT };
  }

  const existingConsent = window.getCkyConsent();

  if (!existingConsent?.isUserActionCompleted) {
    return { ...DEFAULT_CONSENT };
  }

  return normalizeConsent({ categories: existingConsent.categories });
}

function resolveBannerLoadConsent(
  detail: CookieYesBannerLoadDetail,
): ConsentState {
  return normalizeConsent({ categories: detail?.categories });
}

declare global {
  interface Window {
    getCkyConsent?: () => CookieYesConsentSnapshot | null;
  }
}

export function CookieYesPosthogSync() {
  useEffect(() => {
    syncAnalyticsConsent(readConsentFromCookieYes());

    const handleBannerLoad = (event: Event) => {
      const { detail } = event as CustomEvent<CookieYesBannerLoadDetail>;
      syncAnalyticsConsent(resolveBannerLoadConsent(detail));
    };

    const handleConsentUpdate = (event: Event) => {
      const { detail } = event as CustomEvent<CookieYesConsentUpdateDetail>;
      syncAnalyticsConsent(normalizeConsent({ accepted: detail?.accepted }));
    };

    document.addEventListener(
      "cookieyes_banner_load",
      handleBannerLoad as EventListener,
    );
    document.addEventListener(
      "cookieyes_consent_update",
      handleConsentUpdate as EventListener,
    );

    return () => {
      document.removeEventListener(
        "cookieyes_banner_load",
        handleBannerLoad as EventListener,
      );
      document.removeEventListener(
        "cookieyes_consent_update",
        handleConsentUpdate as EventListener,
      );
    };
  }, []);

  return null;
}
