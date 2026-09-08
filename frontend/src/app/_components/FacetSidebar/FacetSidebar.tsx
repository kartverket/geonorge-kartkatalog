"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FACET_VISIBLE_COUNT } from "@/lib/facets";
import type { SearchResult } from "@/lib/schemas/search";
import { FacetGroup } from "./FacetGroup";

type SearchFacet = SearchResult["facets"][number];

export function FacetSidebar({ facets }: { facets: SearchFacet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleFilter = (field: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(field);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    params.delete(field);
    next.forEach((v) => params.append(field, v));
    params.delete("offset");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <aside>
      {facets
        .filter((facet) => facet.label != null && facet.values.length > 0)
        .map((facet) => (
          <FacetGroup
            key={facet.facetField}
            field={facet.facetField}
            label={facet.label as string}
            values={facet.values}
            selected={searchParams.getAll(facet.facetField)}
            initialVisibleCount={FACET_VISIBLE_COUNT[facet.facetField]}
            onToggle={toggleFilter}
          />
        ))}
    </aside>
  );
}
