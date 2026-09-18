"use client";

import {
  CookieBanner,
  CookiePreferences,
  initCookieYes,
  RecallButton,
} from "@cookieyes/nextjs";
import "@cookieyes/nextjs/styles.css";
import { usePosthogConsentSync } from "./PosthogConsent/usePosthogConsentSync";

initCookieYes({
  mode: "cookie-only", // "cookie-only" | "self-hosted"
  regulation: "GDPR", // "GDPR" | "CCPA" | "DEFAULT"
  colorScheme: "system", // "light" | "dark" | "system"
});

export function CookieYesRoot() {
  usePosthogConsentSync();

  return (
    <>
      <CookieBanner />
      <CookiePreferences />
      <RecallButton />
    </>
  );
}
