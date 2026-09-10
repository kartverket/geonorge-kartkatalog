"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { Suspense, useEffect, useState } from "react";
import { basePath } from "@/lib/basePath";
import { parseSearchResult } from "@/lib/schemas/search";
import { DatasetCard, type DatasetCardProps } from "../DatasetCard/DatasetCard";
import { FacetSidebar } from "../FacetSidebar/FacetSidebar";
import styles from "./SearchResults.module.css";
import { type ViewMode, ViewToggle } from "./ViewToggle";

const PAGE_SIZE = 25;

type SearchResultsProps = {
  initialResults: Array<Omit<DatasetCardProps, "viewMode">>;
  totalCount: number;
  searchText: string;
  orderby: string;
  initialLimit: number;
  facets: Array<{
    facetField: string;
    label: string | null;
    values: Array<{ name: string; count: number }>;
  }>;
};

export function SearchResults({
  initialResults,
  totalCount,
  searchText,
  orderby,
  initialLimit,
  facets,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [results, setResults] = useState(initialResults);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(
    initialResults.length >= totalCount,
  );

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
          <Suspense fallback={null}>
            <FacetSidebar facets={facets} />
          </Suspense>
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
