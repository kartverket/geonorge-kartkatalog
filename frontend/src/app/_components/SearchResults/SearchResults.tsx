"use client";

import { useEffect, useState } from "react";
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

export function SearchResults({
  initialViewMode = "grid",
  results,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getInitialViewMode(initialViewMode),
  );

  useEffect(() => {
    void persistViewMode(viewMode);
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
