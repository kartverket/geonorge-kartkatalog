"use client";

import styles from "./HeaderSearch.module.css";
import { SearchField } from "./SearchField";

export function HeaderSearch() {
  return (
    <search className={styles.panel}>
      <SearchField />
    </search>
  );
}
