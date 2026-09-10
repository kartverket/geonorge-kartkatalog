"use client";

import { useEffect, useState } from "react";
import { hasPerformanceConsentInCookieString } from "@/components/PosthogConsent/consentCookie";
import {
  getViewModeFromCookieString,
  VIEW_MODE_COOKIE_NAME,
  type ViewMode,
} from "./viewMode";

function getInitialViewMode(initialViewMode: ViewMode): ViewMode {
  if (typeof document === "undefined") {
    return initialViewMode;
  }

  return getViewModeFromCookieString(document.cookie) ?? initialViewMode;
}

async function persistViewMode(viewMode: ViewMode) {
  const cookieStore = "cookieStore" in window ? window.cookieStore : null;

  if (cookieStore) {
    await cookieStore.set({
      name: VIEW_MODE_COOKIE_NAME,
      value: viewMode,
      path: "/",
      sameSite: "lax",
    });
    return;
  }

  // biome-ignore lint/suspicious/noDocumentCookie: Needed as a fallback where Cookie Store API is unavailable.
  document.cookie = `${VIEW_MODE_COOKIE_NAME}=${viewMode}; path=/; SameSite=Lax`;
}

async function clearPersistedViewMode() {
  const cookieStore = "cookieStore" in window ? window.cookieStore : null;

  if (cookieStore) {
    await cookieStore.delete({
      name: VIEW_MODE_COOKIE_NAME,
      path: "/",
    });
    return;
  }

  // biome-ignore lint/suspicious/noDocumentCookie: Needed as a fallback where Cookie Store API is unavailable.
  document.cookie = `${VIEW_MODE_COOKIE_NAME}=; path=/; SameSite=Lax; Max-Age=0`;
}

async function syncPersistedViewMode(viewMode: ViewMode) {
  if (!hasPerformanceConsentInCookieString(document.cookie)) {
    await clearPersistedViewMode();
    return;
  }

  await persistViewMode(viewMode);
}

export function usePersistedViewMode(initialViewMode: ViewMode) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getInitialViewMode(initialViewMode),
  );

  useEffect(() => {
    const sync = () => {
      void syncPersistedViewMode(viewMode);
    };

    sync();

    document.addEventListener("cookieyes_banner_load", sync as EventListener);
    document.addEventListener(
      "cookieyes_consent_update",
      sync as EventListener,
    );
    window.addEventListener("pageshow", sync);
    window.addEventListener("focus", sync);

    return () => {
      document.removeEventListener(
        "cookieyes_banner_load",
        sync as EventListener,
      );
      document.removeEventListener(
        "cookieyes_consent_update",
        sync as EventListener,
      );
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("focus", sync);
    };
  }, [viewMode]);

  return [viewMode, setViewMode] as const;
}
