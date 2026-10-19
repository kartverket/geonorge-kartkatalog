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
