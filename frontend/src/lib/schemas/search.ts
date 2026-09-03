import { z } from "zod";

const accessState = ["restricted", "open", "protected"] as const;

const SearchFacetValueSchema = z.object({
  name: z.string(),
  count: z.number(),
});

const SearchFacetSchema = z.object({
  facetField: z.string(),
  values: z.array(SearchFacetValueSchema),
});

const SearchResultItemSchema = z
  .object({
    uuid: z.string(),
    title: z.string(),
    organization: z.string().nullable(),
    typeTranslated: z.string().nullable(),
    thumbnailUrl: z.string().nullable(),
    distributionUrl: z.string().nullable(),
    distributionProtocol: z.string().nullable(),
    getCapabilitiesUrl: z.string().nullable(),
    showMapLink: z.boolean(),
    mapCapabilitiesUrl: z.string().nullable(),
    accessState: z.enum(accessState).nullable(),
    hierarchyLevel: z.string().nullable(),
  })
  .transform((item) => ({
    uuid: item.uuid,
    title: item.title,
    organization: item.organization ?? undefined,
    typeTranslated: item.typeTranslated ?? undefined,
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    distributionUrl: item.distributionUrl ?? undefined,
    distributionProtocol: item.distributionProtocol ?? undefined,
    getCapabilitiesUrl: item.getCapabilitiesUrl ?? undefined,
    showMapLink: item.showMapLink,
    mapCapabilitiesUrl: item.mapCapabilitiesUrl ?? undefined,
    accessState: item.accessState,
    hierarchyLevel: item.hierarchyLevel,
  }));

export const SearchResultSchema = z.object({
  numFound: z.number(),
  limit: z.number(),
  offset: z.number(),
  results: z.array(SearchResultItemSchema),
  facets: z.array(SearchFacetSchema).default([]),
  type: z.string(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResultItem = SearchResult["results"][number];

export function parseSearchResult(body: unknown): SearchResult {
  const res = SearchResultSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid search result from server", {
      cause: res.error,
    });
  }

  return res.data;
}
