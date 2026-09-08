"use client";

import { Heading } from "@kv-designsystem/react";
import { useState } from "react";
import { DatasetCard, type DatasetCardProps } from "../DatasetCard/DatasetCard";
import styles from "./SearchResults.module.css";
import { type ViewMode, ViewToggle } from "./ViewToggle";

type SearchResultsProps = {
  results: Array<Omit<DatasetCardProps, "viewMode">>;
  totalCount: number;
};

export function SearchResults({ results, totalCount }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
          </div>
        </div>
      </div>
    </main>
  );
}
