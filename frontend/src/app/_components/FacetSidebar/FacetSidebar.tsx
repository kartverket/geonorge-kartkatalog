"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FACET_CONFIG } from "@/lib/facets";
import type { SearchResult } from "@/lib/schemas/search";
import { FacetGroup } from "./FacetGroup";
import styles from "./FacetSidebar.module.css";
import { SearchableFacetGroup } from "./SearchableFacetGroup";

type SearchFacet = SearchResult["facets"][number];

export function FacetSidebar({
  facets,
  variant = "desktop",
}: {
  facets: SearchFacet[];
  variant?: "desktop" | "mobile";
}) {
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
    next.forEach((v) => {
      params.append(field, v);
    });
    params.delete("page");
    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  const groups = facets
    .filter((facet) => facet.label != null && facet.values.length > 0)
    .map((facet, index) => {
      const config = FACET_CONFIG[facet.facetField];
      const Group = config?.searchable ? SearchableFacetGroup : FacetGroup;

      return (
        <div key={facet.facetField} className={styles.groupWrapper}>
          {index > 0 && <div className={styles.divider} />}
          <Group
            field={facet.facetField}
            label={facet.label as string}
            values={facet.values}
            selected={searchParams.getAll(facet.facetField)}
            initialVisibleCount={config?.initialVisibleCount}
            onToggle={toggleFilter}
          />
        </div>
      );
    });

  if (variant === "mobile") {
    return <div className={styles.mobilePanel}>{groups}</div>;
  }

  return <aside className={styles.sidebar}>{groups} </aside>;
}
