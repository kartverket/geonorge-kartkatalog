"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { FunnelIcon } from "@navikt/aksel-icons";
import { Suspense, useState } from "react";
import type { SearchResult } from "@/lib/schemas/search";
import { DatasetCard, type DatasetCardProps } from "../DatasetCard/DatasetCard";
import { FacetSidebar } from "../FacetSidebar/FacetSidebar";
import { ActiveFilters } from "./ActiveFilters";
import styles from "./SearchResults.module.css";
import { Sidebar } from "./Sidebar";
import { SortDropdown } from "./SortDropdown";
import { ToTopButton } from "./ToTopButton";
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
  initialOffset: number;
  facets: SearchResult["facets"];
};

export function SearchResults({
  initialViewMode = "grid",
  initialResults,
  totalCount,
  searchText,
  orderby,
  initialLimit,
  initialOffset,
  facets,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = usePersistedViewMode(initialViewMode);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
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
    initialOffset,
  });

  const resultsClassName = `${styles.results} ${
    viewMode === "list" ? styles.list : styles.grid
  }`;

  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        <div className={styles.layout}>
          <Sidebar facets={facets} />
          <div
            className={`${styles.content} ${isMobileFilterOpen ? styles.mobileFilterOpen : ""}`}
          >
            <Suspense fallback={null}>
              <ActiveFilters facets={facets} />
            </Suspense>
            <div className={styles.header}>
              <Heading level={2} data-size="sm">
                {totalCount} treff
              </Heading>
              <div className={styles.headerControls}>
                <ViewToggle value={viewMode} onChange={setViewMode} />
                <div className={styles.sortDropdown}>
                  <Suspense fallback={null}>
                    <SortDropdown value={orderby} />
                  </Suspense>
                </div>
                <Button
                  variant="secondary"
                  data-icon
                  aria-pressed={isMobileFilterOpen}
                  aria-label={
                    isMobileFilterOpen ? "Skjul filter" : "Vis filter"
                  }
                  className={styles.mobileFilterToggle}
                  onClick={() => setIsMobileFilterOpen((open) => !open)}
                >
                  <FunnelIcon aria-hidden />
                </Button>
              </div>
            </div>
            <div className={styles.mobileFilterPanel}>
              <Suspense fallback={null}>
                <FacetSidebar facets={facets} variant="mobile" />
              </Suspense>
              <Button
                variant="primary"
                className={styles.showResultsButton}
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Vis {totalCount} treff
              </Button>
            </div>
            <div className={resultsClassName}>
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
              <div className={styles.toTopButton}>
                <ToTopButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
