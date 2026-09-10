"use client";

import { useEffect, useState } from "react";
import { hasPerformanceConsentInCookieString } from "@/components/PosthogConsent/consentCookie";
import { DatasetCard, type DatasetCardProps } from "../DatasetCard/DatasetCard";
import styles from "./SearchResults.module.css";
import { ViewToggle } from "./ViewToggle";
import {
  getViewModeFromCookieString,
  VIEW_MODE_COOKIE_NAME,
  type ViewMode,
} from "./viewMode";

type SearchResultsProps = {
  initialViewMode?: ViewMode;
  results: Array<Omit<DatasetCardProps, "viewMode">>;
};

function getInitialViewMode(initialViewMode: ViewMode): ViewMode {
  if (typeof document === "undefined") {
    return initialViewMode;
  }

  return getViewModeFromCookieString(document.cookie) ?? initialViewMode;
}

async function persistViewMode(viewMode: ViewMode) {
  if ("cookieStore" in window) {
    await window.cookieStore.set({
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
  if ("cookieStore" in window) {
    await window.cookieStore.delete({
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

export function SearchResults({
  initialViewMode = "grid",
  results,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getInitialViewMode(initialViewMode),
  );

  useEffect(() => {
    void syncPersistedViewMode(viewMode);
  }, [viewMode]);

  useEffect(() => {
    const handleConsentChange = () => {
      void syncPersistedViewMode(viewMode);
    };

    document.addEventListener(
      "cookieyes_banner_load",
      handleConsentChange as EventListener,
    );
    document.addEventListener(
      "cookieyes_consent_update",
      handleConsentChange as EventListener,
    );
    window.addEventListener("pageshow", handleConsentChange);
    window.addEventListener("focus", handleConsentChange);

    return () => {
      document.removeEventListener(
        "cookieyes_banner_load",
        handleConsentChange as EventListener,
      );
      document.removeEventListener(
        "cookieyes_consent_update",
        handleConsentChange as EventListener,
      );
      window.removeEventListener("pageshow", handleConsentChange);
      window.removeEventListener("focus", handleConsentChange);
    };
  }, [viewMode]);

  return (
    <main className={styles.page} data-color="neutral">
      <div className={styles.pageInner}>
        <div className={styles.layout}>
          {/* Midlertidig plassholder for filter - fjernes når filter er implementert */}
          <aside className={styles.filterPlaceholder}>
            Filter (kommer snart!)
          </aside>
          <div className={styles.content}>
            <div className={styles.header}>
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            <div
              className={`${styles.results} ${
                viewMode === "list" ? styles.list : styles.grid
              }`}
            >
              {results.map((r) => (
                <DatasetCard key={r.uuid} viewMode={viewMode} {...r} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
