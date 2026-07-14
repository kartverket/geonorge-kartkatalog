"use client";

import { Search } from "@kv-designsystem/react";
import styles from "./HeaderSearch.module.css";

export function HeaderSearch() {
  return (
    <search className={styles.panel}>
      <Search data-color="neutral">
        <Search.Input
          aria-label="Søk i kartkatalogen"
          placeholder="FKB-bygning, Rødlistede arter..."
        />
        <Search.Clear />
      </Search>
    </search>
  );
}
