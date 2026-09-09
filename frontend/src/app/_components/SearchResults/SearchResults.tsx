"use client";

import { Suspense, useState } from "react";
import { DatasetCard, type DatasetCardProps } from "../DatasetCard/DatasetCard";
import { FacetSidebar } from "../FacetSidebar/FacetSidebar";
import styles from "./SearchResults.module.css";
import { type ViewMode, ViewToggle } from "./ViewToggle";

type SearchResultsProps = {
  results: Array<Omit<DatasetCardProps, "viewMode">>;
  facets: Array<{
    facetField: string;
    label: string | null;
    values: Array<{ name: string; count: number }>;
  }>;
};

export function SearchResults({ results, facets }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <main className={styles.page} data-color="neutral">
      <div className={styles.pageInner}>
        <div className={styles.layout}>
          <Suspense fallback={null}>
            <FacetSidebar facets={facets} />
          </Suspense>
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
