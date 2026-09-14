"use client";

import { Button } from "@kv-designsystem/react";
import { XMarkIcon } from "@navikt/aksel-icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RESERVED_SEARCH_PARAMS } from "@/lib/facets";
import type { SearchResult } from "@/lib/schemas/search";
import styles from "./ActiveFilters.module.css";

type SearchFacet = SearchResult["facets"][number];

export function ActiveFilters({ facets }: { facets: SearchFacet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const facetByField = new Map(facets.map((f) => [f.facetField, f]));

  const chips = Array.from(searchParams.entries()).filter(
    ([field]) => !RESERVED_SEARCH_PARAMS.has(field),
  );

  if (chips.length === 0) return null;

  const removeChip = (field: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const remaining = params.getAll(field).filter((v) => v !== value);
    params.delete(field);
    for (const v of remaining) {
      params.append(field, v);
    }
    params.delete("offset");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.activeFilters}>
      {chips.map(([field, value]) => {
        const facet = facetByField.get(field);
        const valueLabel =
          facet?.values.find((v) => v.name === value)?.label ?? value;
        return (
          <Button
            key={`${field}-${value}`}
            variant="tertiary"
            className={styles.filterChip}
            onClick={() => removeChip(field, value)}
          >
            <XMarkIcon aria-hidden />
            {valueLabel}
          </Button>
        );
      })}
    </div>
  );
}
