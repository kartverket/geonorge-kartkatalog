import type { SearchResult } from "@/lib/schemas/search";

type SearchFacet = SearchResult["facets"][number];

type FacetConfig = {
  initialVisibleCount?: number;
  searchable?: boolean;
};

export const FACET_CONFIG: Record<string, FacetConfig> = {
  theme: { initialVisibleCount: 4 },
  organizations: { initialVisibleCount: 4, searchable: true },
  area: { initialVisibleCount: 3 },
  DistributionProtocols: { initialVisibleCount: 3 },
  nationalinitiative: { initialVisibleCount: 4 },
};

export const RESERVED_SEARCH_PARAMS = new Set([
  "text",
  "offset",
  "limit",
  "orderby",
]);

/**
 * Removes facet values with zero hits, and facet groups left without values.
 * A parent value is kept if any of its sub-values (values whose `category`
 * equals the parent's `name`) has hits.
 */
export function withHits(facets: SearchFacet[]): SearchFacet[] {
  return facets
    .map((facet) => {
      const parentsWithHits = new Set(
        facet.values
          .filter((v) => v.category != null && v.count > 0)
          .map((v) => v.category),
      );
      return {
        ...facet,
        values: facet.values.filter(
          (v) => v.count > 0 || parentsWithHits.has(v.name),
        ),
      };
    })
    .filter((facet) => facet.values.length > 0);
}
