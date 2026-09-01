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

type CookieYesBannerLoadDetail = {
  categories?: CookieYesCategories | null;
} | null;

type CookieYesConsentUpdateDetail = {
  accepted?: CookieYesCategories | null;
} | null;

const CATEGORY_ALIASES = {
  analytics: ["analytics", "statistical", "statistics"],
  functional: ["functional", "preferences", "preference", "necessary"],
  performance: ["performance"],
  advertisement: ["advertisement", "advertising", "marketing"],
} satisfies Record<keyof ConsentState, readonly string[]>;

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return [
      "1",
      "accept",
      "accepted",
      "allow",
      "allowed",
      "true",
      "yes",
    ].includes(normalizeKey(value));
  }

  return false;
}

function hasCategories(categories: CookieYesCategories): boolean {
  if (!categories) {
    return false;
  }

  if (Array.isArray(categories)) {
    return categories.length > 0;
  }

  return Object.keys(categories).length > 0;
}

function normalizeConsent(categories: CookieYesCategories): ConsentState {
  const consent = { ...DEFAULT_CONSENT };

  if (!categories) {
    return consent;
  }

  if (Array.isArray(categories)) {
    const accepted = new Set(
      categories.map((category) => normalizeKey(String(category))),
    );

    for (const [key, aliases] of Object.entries(CATEGORY_ALIASES) as Array<
      [keyof ConsentState, readonly string[]]
    >) {
      consent[key] = aliases.some((alias) => accepted.has(alias));
    }

    return consent;
  }

  for (const [key, value] of Object.entries(categories)) {
    const normalizedCategory = normalizeKey(key);

    for (const [category, aliases] of Object.entries(CATEGORY_ALIASES) as Array<
      [keyof ConsentState, readonly string[]]
    >) {
      if (aliases.includes(normalizedCategory)) {
        consent[category] = consent[category] || toBoolean(value);
      }
    }
  }

  return consent;
}

function readConsentFromCookieYes(): ConsentState {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CONSENT };
  }

  try {
    return normalizeConsent(window.getCkyConsent?.()?.categories);
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

function resolveBannerLoadConsent(
  detail: CookieYesBannerLoadDetail,
): ConsentState {
  if (hasCategories(detail?.categories)) {
    return normalizeConsent(detail?.categories);
  }

  return readConsentFromCookieYes();
}

declare global {
  interface Window {
    getCkyConsent?: () => {
      categories?: CookieYesCategories | null;
    } | null;
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
      syncAnalyticsConsent(normalizeConsent(detail?.accepted));
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
