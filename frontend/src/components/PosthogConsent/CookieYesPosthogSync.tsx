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

type CookieYesConsentCookie = Partial<Record<string, string>>;

type CookieYesConsentSnapshot = {
  categories?: CookieYesCategories | null;
} & Record<string, unknown>;

type CookieYesBannerLoadDetail = {
  categories?: CookieYesCategories | null;
} | null;

type CookieYesConsentUpdateDetail = {
  accepted?: CookieYesCategories | null;
  categories?: CookieYesCategories | null;
} | null;

const CATEGORY_ALIASES = {
  analytics: ["analytics", "statistical", "statistics"],
  functional: ["functional", "preferences", "preference"],
  performance: ["performance"],
  advertisement: ["advertisement", "advertising", "marketing"],
} satisfies Record<keyof ConsentState, readonly string[]>;

const COOKIEYES_CONSENT_COOKIE_NAME = "cookieyes-consent";

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

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;

  for (const cookie of document.cookie.split(";")) {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.startsWith(prefix)) {
      return trimmedCookie.slice(prefix.length);
    }
  }

  return null;
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isCookieYesConsentSnapshot(
  snapshot: CookieYesCategories | CookieYesConsentSnapshot,
): snapshot is CookieYesConsentSnapshot {
  return (
    typeof snapshot === "object" &&
    snapshot !== null &&
    !Array.isArray(snapshot) &&
    "categories" in snapshot
  );
}

function parseCookieYesConsentCookie(): CookieYesConsentCookie | null {
  const rawValue = readCookie(COOKIEYES_CONSENT_COOKIE_NAME);

  if (!rawValue) {
    return null;
  }

  const decodedValue = decodeCookieValue(rawValue);

  const entries = decodedValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(":");

      if (separatorIndex === -1) {
        return null;
      }

      const key = normalizeKey(entry.slice(0, separatorIndex));
      const value = entry.slice(separatorIndex + 1).trim();

      if (!key) {
        return null;
      }

      return [key, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries);
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

function normalizeConsentSnapshot(
  snapshot: CookieYesCategories | CookieYesConsentSnapshot | null | undefined,
): ConsentState {
  if (!snapshot) {
    return { ...DEFAULT_CONSENT };
  }

  if (Array.isArray(snapshot)) {
    return normalizeConsent(snapshot);
  }

  if (
    isCookieYesConsentSnapshot(snapshot) &&
    hasCategories(snapshot.categories)
  ) {
    return normalizeConsent(snapshot.categories);
  }

  return normalizeConsent(snapshot);
}

function readConsentFromCookieYes(): ConsentState {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CONSENT };
  }

  try {
    const consentSnapshot = window.getCkyConsent?.();

    if (consentSnapshot) {
      const normalizedConsent = normalizeConsentSnapshot(consentSnapshot);

      if (
        Object.values(normalizedConsent).some(
          (categoryAccepted) => categoryAccepted,
        )
      ) {
        return normalizedConsent;
      }
    }
  } catch {
    // Fall back to the CookieYes cookie below.
  }

  return normalizeConsentSnapshot(parseCookieYesConsentCookie());
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
      const acceptedCategories = detail?.accepted;
      const selectedCategories = detail?.categories;

      if (hasCategories(acceptedCategories)) {
        syncAnalyticsConsent(normalizeConsent(acceptedCategories));
        return;
      }

      if (hasCategories(selectedCategories)) {
        syncAnalyticsConsent(normalizeConsent(selectedCategories));
        return;
      }

      syncAnalyticsConsent(readConsentFromCookieYes());
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
