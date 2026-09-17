"use client";

import { useConsentCategory } from "@cookieyes/nextjs";
import { useEffect, useState } from "react";
import { VIEW_MODE_COOKIE_NAME, type ViewMode } from "./viewMode";

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

async function syncPersistedViewMode(
  viewMode: ViewMode,
  hasPerformanceConsent: boolean,
) {
  if (!hasPerformanceConsent) {
    await clearPersistedViewMode();
    return;
  }

  await persistViewMode(viewMode);
}

export function usePersistedViewMode(initialViewMode: ViewMode) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const hasPerformanceConsent = useConsentCategory("performance");

  useEffect(() => {
    void syncPersistedViewMode(viewMode, hasPerformanceConsent);
  }, [hasPerformanceConsent, viewMode]);

  return [viewMode, setViewMode] as const;
}
