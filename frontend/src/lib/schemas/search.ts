import { z } from "zod";

const DatasetServiceWithShowMapLinkSchema = z
  .object({
    Uuid: z.string(),
    Title: z.string(),
    DistributionProtocol: z.string().nullable().optional(),
    GetCapabilitiesUrl: z.string().nullable().optional(),
  })
  .transform((item) => ({
    uuid: item.Uuid,
    title: item.Title,
    distributionProtocol: item.DistributionProtocol ?? null,
    getCapabilitiesUrl: item.GetCapabilitiesUrl ?? null,
  }));

const SearchResultItemSchema = z
  .object({
    Uuid: z.string(),
    Title: z.string(),
    Abstract: z.string().nullable().optional(),
    Type: z.string().nullable().optional(),
    TypeTranslated: z.string().nullable().optional(),
    TypeName: z.string().nullable().optional(),
    Theme: z.string().nullable().optional(),
    Organization: z.string().nullable().optional(),
    Organizations: z.array(z.string()).optional().default([]),
    OrganizationLogo: z.string().nullable().optional(),
    ThumbnailUrl: z.string().nullable().optional(),
    DistributionUrl: z.string().nullable().optional(),
    DistributionProtocol: z.string().nullable().optional(),
    DistributionName: z.string().nullable().optional(),
    DatasetServicesWithShowMapLink: z
      .array(DatasetServiceWithShowMapLinkSchema)
      .optional()
      .default([]),
    ServiceDatasets: z.array(z.string()).optional().default([]),
    Distributions: z.array(z.string()).optional().default([]),
    AccessConstraint: z.string().nullable().optional(),
    OtherConstraintsAccess: z.string().nullable().optional(),
    DataAccess: z.string().nullable().optional(),
    AccessIsOpendata: z.boolean().nullable().optional(),
    AccessIsRestricted: z.boolean().optional().default(false),
    AccessIsProtected: z.boolean().optional().default(false),
    ServiceDistributionUrlForDataset: z.string().nullable().optional(),
    ServiceUuid: z.string().nullable().optional(),
    ServiceWfsDistributionUrlForDataset: z.string().nullable().optional(),
    GetCapabilitiesUrl: z.string().nullable().optional(),
    Date: z.string().nullable().optional(),
    ShowMapLink: z.boolean().optional().default(false),
    SpatialScope: z.string().nullable().optional(),
  })
  .transform((item) => ({
    uuid: item.Uuid,
    title: item.Title,
    abstractText: item.Abstract ?? null,
    type: item.Type ?? null,
    typeTranslated: item.TypeTranslated ?? null,
    typeName: item.TypeName ?? null,
    theme: item.Theme ?? null,
    organization: item.Organization ?? null,
    organizations: item.Organizations,
    organizationLogo: item.OrganizationLogo ?? null,
    thumbnailUrl: item.ThumbnailUrl ?? null,
    distributionUrl: item.DistributionUrl ?? null,
    distributionProtocol: item.DistributionProtocol ?? null,
    distributionName: item.DistributionName ?? null,
    datasetServicesWithShowMapLink: item.DatasetServicesWithShowMapLink,
    serviceDatasets: item.ServiceDatasets,
    distributions: item.Distributions,
    accessConstraint: item.AccessConstraint ?? null,
    otherConstraintsAccess: item.OtherConstraintsAccess ?? null,
    dataAccess: item.DataAccess ?? null,
    accessIsOpenData: item.AccessIsOpendata ?? null,
    accessIsRestricted: item.AccessIsRestricted,
    accessIsProtected: item.AccessIsProtected,
    serviceDistributionUrlForDataset:
      item.ServiceDistributionUrlForDataset ?? null,
    serviceUuid: item.ServiceUuid ?? null,
    serviceWfsDistributionUrlForDataset:
      item.ServiceWfsDistributionUrlForDataset ?? null,
    getCapabilitiesUrl: item.GetCapabilitiesUrl ?? null,
    date: item.Date ?? null,
    showMapLink: item.ShowMapLink,
    spatialScope: item.SpatialScope ?? null,
  }));

export const SearchResultSchema = z
  .object({
    NumFound: z.number(),
    Limit: z.number(),
    Offset: z.number(),
    Results: z.array(SearchResultItemSchema),
    Type: z.string(),
  })
  .transform((result) => ({
    numFound: result.NumFound,
    limit: result.Limit,
    offset: result.Offset,
    results: result.Results,
    type: result.Type,
  }));

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
