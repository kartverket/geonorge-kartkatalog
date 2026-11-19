"use client";

import {
  Button,
  Heading,
  Pagination,
  usePagination,
} from "@kv-designsystem/react";
import { FunnelIcon } from "@navikt/aksel-icons";
import { type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import type { SearchResult } from "@/lib/schemas/search";
import type { DatasetCardData } from "@/lib/types/dataset";
import { DatasetCard } from "../DatasetCard/DatasetCard";
import { FacetSidebar } from "../FacetSidebar/FacetSidebar";
import { ActiveFilters } from "./ActiveFilters";
import styles from "./SearchResults.module.css";
import { Sidebar } from "./Sidebar";
import { SortDropdown } from "./SortDropdown";
import { ToTopButton } from "./ToTopButton";
import { useHideOnScrollDown } from "./useHideOnScrollDown";
import { usePersistedViewMode } from "./usePersistedViewMode";
import { useUpdateUrlProp } from "./useUpdateUrlProp";
import { ViewToggle } from "./ViewToggle";
import type { ViewMode } from "./viewMode";

type SearchResultsProps = {
  hero: ReactNode;
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
  hero,
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
  const topRef = useRef<HTMLElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const hidden = useHideOnScrollDown(isMobileFilterOpen, scopeRef);

  useEffect(() => {
    const scope = scopeRef.current;
    const heroEl = heroRef.current;
    if (!scope || !heroEl) return;
    const observer = new ResizeObserver(() => {
      scope.style.setProperty(
        "--search-hero-height",
        `${heroEl.offsetHeight}px`,
      );
    });
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  const updateUrlProp = useUpdateUrlProp();

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    updateUrlProp("page", page.toString());
  };

  const { pages, prevButtonProps, nextButtonProps } = usePagination({
    currentPage,
    setCurrentPage: handlePageChange,
    totalPages: Math.ceil(totalCount / pageSize),
    showPages: 7,
  });

  const resultsClassName = `${styles.results} ${
    viewMode === "list" ? styles.list : styles.grid
  }`;

  return (
    <div className={styles.stickyScope} data-hidden={hidden} ref={scopeRef}>
      <div className={styles.heroSticky} ref={heroRef} inert={hidden}>
        {hero}
      </div>
      <main className={styles.page} ref={topRef}>
        <div className={styles.pageInner}>
          <div className={styles.layout}>
            <Sidebar facets={facets} />
            <div
              className={`${styles.content} ${isMobileFilterOpen ? styles.mobileFilterOpen : ""}`}
            >
              <div className={styles.controls} inert={hidden}>
                <div className={styles.activeFilters}>
                  <Suspense fallback={null}>
                    <ActiveFilters facets={facets} />
                  </Suspense>
                </div>
                <div className={styles.header}>
                  <Heading level={2} data-size="sm">
                    Viser {initialResults.length} av {totalCount} treff
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
    </div>
  );
}
