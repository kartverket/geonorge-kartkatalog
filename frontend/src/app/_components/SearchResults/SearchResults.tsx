"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { useEffect, useState } from "react";
import { basePath } from "@/lib/basePath";
import { parseSearchResult } from "@/lib/schemas/search";
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

const PAGE_SIZE = 25;

type SearchResultsProps = {
  initialViewMode?: ViewMode;
  initialResults: Array<Omit<DatasetCardProps, "viewMode">>;
  totalCount: number;
  searchText: string;
  orderby: string;
  initialLimit: number;
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
                                initialResults,
  totalCount,
  searchText,
  orderby,
  initialLimit,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getInitialViewMode(initialViewMode),
  );
  const [results, setResults] = useState(initialResults);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(
    initialResults.length >= totalCount,
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

  useEffect(() => {
    setResults(initialResults);
    setIsLoadingMore(false);
    setLoadMoreError(null);
    setHasReachedEnd(initialResults.length >= totalCount);
  }, [initialResults, totalCount]);

  const hasMoreResults = !hasReachedEnd && results.length < totalCount;

  async function handleLoadMore() {
    if (isLoadingMore || !hasMoreResults) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const params = new URLSearchParams({
        limit: String(initialLimit || PAGE_SIZE),
        offset: String(results.length + 1),
        orderby,
      });

      if (searchText.trim()) {
        params.set("text", searchText.trim());
      }

      const response = await fetch(
        `${basePath}/api/search?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Kunne ikke hente flere treff.");
      }

      const body: unknown = await response.json();
      const nextPage = parseSearchResult(body);
      const lastVisibleResultIndex =
        nextPage.offset + nextPage.results.length - 1;

      setResults((currentResults) => [...currentResults, ...nextPage.results]);
      setHasReachedEnd(
        nextPage.results.length === 0 ||
          lastVisibleResultIndex >= nextPage.numFound,
      );
    } catch {
      setLoadMoreError("Kunne ikke hente flere treff akkurat nå.");
    } finally {
      setIsLoadingMore(false);
    }
  }

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
              <Heading data-size="sm">{totalCount} treff</Heading>
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
            <div className={styles.loadMoreSection}>
              {loadMoreError ? (
                <Paragraph
                  className={styles.loadMoreMessage}
                  aria-live="polite"
                >
                  {loadMoreError}
                </Paragraph>
              ) : null}
              {hasMoreResults ? (
                <Button
                  variant="secondary"
                  data-size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Laster flere treff..." : "Vis mer"}
                </Button>
              ) : results.length > 0 ? (
                <Paragraph
                  className={styles.loadMoreMessage}
                  aria-live="polite"
                >
                  Alle treff er vist.
                </Paragraph>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
