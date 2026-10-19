"use client";

import { useState } from "react";
import {
  FacetGroup,
  type FacetGroupProps,
  type FacetValue,
} from "./FacetGroup";
import { FacetSearch } from "./FacetSearch";

function matchesSearch(value: FacetValue, searchTerm: string): boolean {
  return (value.label ?? value.name)
    .toLocaleLowerCase("nb-NO")
    .includes(searchTerm);
}

export function SearchableFacetGroup({
  label,
  values,
  initialVisibleCount,
  ...props
}: FacetGroupProps) {
  const [search, setSearch] = useState("");
  const searchTerm = search.trim().toLocaleLowerCase("nb-NO");
  const isSearching = searchTerm.length > 0;
  const filteredValues = isSearching
    ? values.filter((value) => matchesSearch(value, searchTerm))
    : values;

  return (
    <FacetGroup
      {...props}
      label={label}
      values={filteredValues}
      initialVisibleCount={isSearching ? undefined : initialVisibleCount}
      filterControl={
        <FacetSearch
          ariaLabel={`Søk etter ${label.toLocaleLowerCase("nb-NO")}`}
          value={search}
          onChange={setSearch}
        />
      }
    />
  );
}
