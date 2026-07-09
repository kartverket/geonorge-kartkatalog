"use client";

import { useState } from "react";
import { DatasetCard, type DatasetCardProps } from "../DatasetCard/DatasetCard";
import styles from "./SearchResults.module.css";
import { type ViewMode, ViewToggle } from "./ViewToggle";

type SearchResultsProps = {
  results: Array<Omit<DatasetCardProps, "viewMode">>;
  numFound: number;
};

export function SearchResults({ results, numFound }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>Datasett ({numFound})</h1>
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
    </main>
  );
}
