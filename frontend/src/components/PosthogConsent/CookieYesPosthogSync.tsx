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

const CONSENT_COOKIE_NAME = "cookieyes-consent";

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

// Cookie format: consentid:...,consent:yes,action:yes,necessary:yes,analytics:yes,...
function parseConsentCookie(): ConsentState | null {
  if (typeof document === "undefined") return null;

  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!raw) return null;

  const value = decodeURIComponent(raw.slice(CONSENT_COOKIE_NAME.length + 1));
  const parts = new Map<string, string>();
  for (const pair of value.split(",")) {
    const idx = pair.indexOf(":");
    if (idx === -1) continue;
    parts.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }

  if (parts.get("action") !== "yes") return null;

  return consentCategoryKeys.reduce<ConsentState>(
    (state, key) => {
      state[key] = parts.get(key) === "yes";
      return state;
    },
    { ...DEFAULT_CONSENT },
  );
}

function readConsentFromCookieYes(): ConsentState {
  if (typeof window !== "undefined" && window.getCkyConsent) {
    const snap = window.getCkyConsent();
    if (snap?.isUserActionCompleted) {
      return normalizeConsent({ categories: snap.categories });
    }
  }

  return parseConsentCookie() ?? { ...DEFAULT_CONSENT };
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

    // Consent may be changed on the sibling app under `/` — re-read on return.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") applyCurrentConsent();
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
