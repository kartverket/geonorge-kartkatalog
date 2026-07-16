"use client";

import { Search } from "@kv-designsystem/react";

export function SearchField() {
  return (
    <Search data-color="neutral">
      <Search.Input
        aria-label="Søk i kartkatalogen"
        placeholder="FKB-bygning, Rødlistede arter..."
      />
      <Search.Clear />
    </Search>
  );
}
