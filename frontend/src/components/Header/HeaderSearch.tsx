"use client";

import styles from "./HeaderSearch.module.css";
import { SearchField } from "./SearchField";

export function HeaderSearch() {
  return (
    <search id="header-search-panel" className={styles.panel}>
      <SearchField />
    </search>
  );
}
