"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { DatasetCard, type DatasetCardProps } from "../DatasetCard/DatasetCard";
import styles from "./SearchResults.module.css";
import { usePaginatedSearchResults } from "./usePaginatedSearchResults";
import { usePersistedViewMode } from "./usePersistedViewMode";
import { ViewToggle } from "./ViewToggle";
import type { ViewMode } from "./viewMode";

type SearchResultsProps = {
  initialViewMode?: ViewMode;
  initialResults: Array<Omit<DatasetCardProps, "viewMode">>;
  totalCount: number;
  searchText: string;
  orderby: string;
  initialLimit: number;
};

export function SearchResults({
  initialViewMode = "grid",
  initialResults,
  totalCount,
  searchText,
  orderby,
  initialLimit,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = usePersistedViewMode(initialViewMode);
  const {
    results,
    isLoadingMore,
    loadMoreError,
    hasMoreResults,
    handleLoadMore,
  } = usePaginatedSearchResults({
    initialResults,
    totalCount,
    searchText,
    orderby,
    initialLimit,
  });

  const resultsClassName = `${styles.results} ${
    viewMode === "list" ? styles.list : styles.grid
  }`;

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

            <div className={resultsClassName}>
              {results.map((result) => (
                <DatasetCard
                  key={result.uuid}
                  viewMode={viewMode}
                  {...result}
                />
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
