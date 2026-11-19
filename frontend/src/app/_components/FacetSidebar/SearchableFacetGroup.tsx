"use client";

import { Search } from "@kv-designsystem/react";
import { useState } from "react";
import { useDictionary, useLocale } from "@/components/I18nProvider";
import { format } from "@/lib/i18n/dictionary";
import {
  FacetGroup,
  type FacetGroupProps,
  type FacetValue,
} from "./FacetGroup";

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
  const t = useDictionary().facets;
  const locale = useLocale();
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
        <Search>
          <Search.Input
            aria-label={format(t.searchIn, {
              label: label.toLocaleLowerCase(locale === "en" ? "en" : "nb-NO"),
            })}
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Search>
      }
    />
  );
}
