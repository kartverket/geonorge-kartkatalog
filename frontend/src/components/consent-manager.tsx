"use client";

import {
  CookieBanner,
  CookiePreferences,
  RecallButton,
  initCookieYes,
} from "@cookieyes/nextjs";
import "@cookieyes/nextjs/styles.css";

initCookieYes({
  mode: "cookie-only",    // "cookie-only" | "self-hosted"
  regulation: "GDPR",     // "GDPR" | "CCPA" | "DEFAULT"
  colorScheme: "system",  // "light" | "dark" | "system"
});

export function CookieYesRoot() {
  return (
    <>
      <CookieBanner />
      <CookiePreferences />
      <RecallButton />
    </>
  );
}
