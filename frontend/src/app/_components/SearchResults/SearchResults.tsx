"use client";

import {
  Button,
  Heading,
  Pagination,
  Paragraph,
  usePagination,
} from "@kv-designsystem/react";
import { FunnelIcon } from "@navikt/aksel-icons";
import { Suspense, useState } from "react";
import { DatasetCard } from "../DatasetCard/DatasetCard";
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
  filters: Record<string, string[]>;
  searchText: string;
  orderby: string;
  initialOffset: number;
};

export function SearchResults({
  initialViewMode = "grid",
  searchText,
  filters,
  orderby,
  initialOffset,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = usePersistedViewMode(initialViewMode);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const {
    results,
    facets,
    isLoadingMore,
    loadMoreError,
    currentPage,
    hasMoreResults,
    total,
    totalPageCount,
    setCurrentPage,
  } = usePaginatedSearchResults({
    searchText,
    filters,
    orderby,
    initialOffset,
  });

  const onChange = (_event, page: number) =>
    console.log(`Going to page ${page}`);
  const { pages, prevButtonProps, nextButtonProps } =
    usePagination({
      currentPage,
      setCurrentPage,
      totalPages: totalPageCount,
      showPages: 6,
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
                {total} treff
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
                Vis {total} treff
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

              <Pagination>
                <Pagination.List>
                  <Pagination.Item>
                    <Pagination.Button
                      aria-label="Forrige side"
                      data-variant="tertiary"
                      {...prevButtonProps}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Forrige
                    </Pagination.Button>
                  </Pagination.Item>

                  {pages.map(({ page, itemKey, buttonProps }) => (
                    <Pagination.Item key={itemKey}>
                      {typeof page === "number" && (
                        <Pagination.Button
                          aria-label={`Side ${page}`}
                          {...buttonProps}
                        >
                          {page}
                        </Pagination.Button>
                      )}
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Button
                      aria-label="Neste side"
                      data-variant="tertiary"
                      {...nextButtonProps}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Neste
                    </Pagination.Button>
                  </Pagination.Item>
                </Pagination.List>
              </Pagination>

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
