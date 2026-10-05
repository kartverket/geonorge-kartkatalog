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
import type { SearchResult } from "@/lib/schemas/search";
import type { DatasetCardData } from "@/lib/types/dataset";
import { DatasetCard } from "../DatasetCard/DatasetCard";
import { FacetSidebar } from "../FacetSidebar/FacetSidebar";
import { ActiveFilters } from "./ActiveFilters";
import styles from "./SearchResults.module.css";
import { Sidebar } from "./Sidebar";
import { SortDropdown } from "./SortDropdown";
import { ToTopButton } from "./ToTopButton";
import { usePersistedViewMode } from "./usePersistedViewMode";
import { ViewToggle } from "./ViewToggle";
import type { ViewMode } from "./viewMode";
import { useUpdateUrlProp } from "./useUpdateUrlProp";

type SearchResultsProps = {
  initialViewMode?: ViewMode;
  initialResults: DatasetCardData[];
  pageSize: number;
  currentPage: number;
  totalCount: number;
  searchText: string;
  orderby: string;
  facets: SearchResult["facets"];
};

export function SearchResults({
  initialViewMode = "grid",
  initialResults,
  currentPage,
  pageSize,
  totalCount,
  orderby,
  facets,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = usePersistedViewMode(initialViewMode);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const updateUrlProp = useUpdateUrlProp();
  const handlePageChange = (page: number) => {
    updateUrlProp("page", page.toString());
  };

  const resultsClassName = `${styles.results} ${
    viewMode === "list" ? styles.list : styles.grid
  }`;

  const { pages, prevButtonProps, nextButtonProps } = usePagination({
    currentPage,
    setCurrentPage: handlePageChange,
    totalPages: Math.ceil(totalCount / pageSize),
    showPages: 7,
  });

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
              {initialResults.map((r) => (
                <DatasetCard key={r.uuid} viewMode={viewMode} {...r} />
              ))}
            </div>

            <div className={styles.loadMoreSection}>
              <Pagination>
                <Pagination.List>
                  <Pagination.Item>
                    <Pagination.Button {...prevButtonProps} />
                  </Pagination.Item>

                  {pages.map(({ page, itemKey, buttonProps }) => (
                    <Pagination.Item key={itemKey}>
                      {typeof page === "number" && (
                        <Pagination.Button
                          asChild
                          aria-label={`Side ${page}`}
                          {...buttonProps}
                        >
                          <p>{page}</p>
                        </Pagination.Button>
                      )}
                    </Pagination.Item>
                  ))}

                  <Pagination.Item>
                    <Pagination.Button {...nextButtonProps} />
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
