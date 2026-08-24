import { z } from "zod";

export const ProductDistributionFormatSchema = z.object({
  name: z.string().nullable(),
  version: z.string().nullable(),
});

export const ProductKeywordSchema = z.object({
  keywordValue: z.string().nullable(),
  type: z.string().nullable(),
});

export const LegalConstraintsSchema = z.object({
  accessConstraints: z.string().nullable(),
  useConstraints: z.string().nullable(),
  useLimitations: z.array(z.string()),
  otherConstraintsLink: z.string().nullable(),
  otherConstraintsLinkText: z.string().nullable(),
});

export type ProductLegalConstraints = z.infer<typeof LegalConstraintsSchema>;

export const ProductMetadataContactSchema = z.object({
  email: z.string().nullable(),
  name: z.string().nullable(),
  organization: z.string().nullable(),
  organizationEnglish: z.string().nullable(),
  role: z.string().nullable(),
});

export const ReferenceSystemSchema = z.object({
  code: z.string().nullable(),
  codeSpace: z.string().nullable(),
});

export const DistributionFormatEntrySchema = z.object({
  name: z.string(),
  urls: z.array(z.string()),
});

export const DistributionGroupSchema = z.object({
  protocol: z.string().nullable(),
  protocolName: z.string().nullable(),
  protocolDescription: z.string().nullable(),
  formats: z.array(DistributionFormatEntrySchema),
  unitsOfDistribution: z.string().nullable(),
});

export type ReferenceSystem = z.infer<typeof ReferenceSystemSchema>;
export type DistributionGroup = z.infer<typeof DistributionGroupSchema>;

export type Contact = z.infer<typeof ProductMetadataContactSchema>;

const accessState = ["restricted", "open", "protected"] as const;
export type AccessState = (typeof accessState)[number];

export const ProductMetadataSchema = z.object({
  title: z.string(),
  organization: z.string().nullable(),
  hierarchyLevel: z.string(),
  accessState: z.enum(accessState).nullable(),
  dateUpdated: z.string().nullable(),
  maintenanceFrequency: z.string().nullable(),
  spatialRepresentation: z.string().nullable(),
  spatialScope: z.string().nullable(),
  resolutionScale: z.string().nullable(),
  keywordsTheme: z.array(ProductKeywordSchema),
  nationalKeywords: z.array(ProductKeywordSchema),
  relevantCategories: z.array(z.string()),
  dokStatus: z.string().nullable(),
  isHighValueDataset: z.boolean(),
  distributionFormats: z.array(ProductDistributionFormatSchema),
  thumbnailUrl: z.string().nullable(),
  fairStatusPercentFromMetadata: z.number().nullable(),
  abstractText: z.string().nullable(),
  purpose: z.string().nullable(),
  specificUsage: z.string().nullable(),
  processHistory: z.string().nullable(),
  constraints: LegalConstraintsSchema.nullable(),
  securityClassification: z.string().nullable(),
  contactMetadata: ProductMetadataContactSchema.nullable(),
  contactOwner: ProductMetadataContactSchema.nullable(),
  contactPublisher: ProductMetadataContactSchema.nullable(),
  referenceSystems: z.array(ReferenceSystemSchema),
  distributionGroups: z.array(DistributionGroupSchema),
  coverageUrl: z.string().nullable(),
});

export type ProductConstraints = Partial<ProductLegalConstraints> & {
  securityConstraints: string | null;
};

export type ProductMetadata = z.infer<typeof ProductMetadataSchema>;

export function parseProductMetadata(body: unknown): ProductMetadata {
  const res = ProductMetadataSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid metadata from server", {
      cause: res.error,
    });
  }

  return res.data;
}

const FairCriterionSchema = z.object({
  Code: z.string(),
  Description: z.string(),
  Fulfilled: z.boolean().nullable(),
});

const FairCriteriaGroupSchema = z.object({
  Code: z.string(),
  Label: z.string(),
  Criteria: z.array(FairCriterionSchema),
});

const FairPrincipleSchema = z.object({
  Code: z.string(),
  Label: z.string(),
  Description: z.string(),
  Status: z.string(),
  StatusPerCent: z.number().nullable(),
  CriteriaGroups: z.array(FairCriteriaGroupSchema),
});

const FairRatingLevelSchema = z.object({
  Status: z.string(),
  Description: z.string(),
});

const FairRatingSchema = z.object({
  Label: z.string(),
  Description: z.string(),
  Levels: z.array(FairRatingLevelSchema),
});

export const ProductFairStatusSchema = z
  .object({
    FairStatus: z.string().nullable(),
    FAIRStatusPerCent: z.number().nullable(),
    FindableStatus: z.string().nullable(),
    FindableStatusPerCent: z.number().nullable(),
    AccesibleStatus: z.string().nullable(),
    AccesibleStatusPerCent: z.number().nullable(),
    InteroperableStatus: z.string().nullable(),
    InteroperableStatusPerCent: z.number().nullable(),
    ReUseableStatus: z.string().nullable(),
    ReUseableStatusPerCent: z.number().nullable(),
    DetailsPage: z.string().nullable(),
    Rating: FairRatingSchema,
    Principles: z.array(FairPrincipleSchema),
  })
  .transform((status) => ({
    totalPercent: status.FAIRStatusPerCent,
    totalStatus: status.FairStatus,
    findablePercent: status.FindableStatusPerCent,
    findableStatus: status.FindableStatus,
    accessiblePercent: status.AccesibleStatusPerCent,
    accessibleStatus: status.AccesibleStatus,
    interoperablePercent: status.InteroperableStatusPerCent,
    interoperableStatus: status.InteroperableStatus,
    reusablePercent: status.ReUseableStatusPerCent,
    reusableStatus: status.ReUseableStatus,
    detailsPageUrl: status.DetailsPage,
    rating: status.Rating,
    principles: status.Principles,
  }));

export type ProductFairStatus = z.infer<typeof ProductFairStatusSchema>;

export function parseProductFairStatus(body: unknown): ProductFairStatus {
  const res = ProductFairStatusSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid FAIR status from register", {
      cause: res.error,
    });
  }
  return res.data;
}

export const LinkedDistributionSchema = z.object({
  uuid: z.string(),
  title: z.string().nullable(),
  organization: z.string().nullable(),
  typeTranslated: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  distributionUrl: z.string().nullable(),
  distributionProtocol: z.string().nullable(),
  getCapabilitiesUrl: z.string().nullable(),
  showMapLink: z.boolean(),
  mapCapabilitiesUrl: z.string().nullable(),
  formats: z.array(z.string()),
  protocolNames: z.array(z.string()),
  hierarchyLevel: z.string().nullable(),
});

export const LinkedDistributionsSchema = z.object({
  applications: z.array(LinkedDistributionSchema),
  viewServices: z.array(LinkedDistributionSchema),
  downloadServices: z.array(LinkedDistributionSchema),
  seriesMembers: z.array(LinkedDistributionSchema),
  parentSeries: z.array(LinkedDistributionSchema),
  relatedDatasets: z.array(LinkedDistributionSchema),
  serviceLayers: z.array(LinkedDistributionSchema),
  parentService: z.array(LinkedDistributionSchema),
});

export type LinkedDistribution = z.infer<typeof LinkedDistributionSchema>;
export type LinkedDistributions = z.infer<typeof LinkedDistributionsSchema>;

export function parseLinkedDistributions(body: unknown): LinkedDistributions {
  const res = LinkedDistributionsSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid linked distributions from server", {
      cause: res.error,
    });
  }
  return res.data;
}
