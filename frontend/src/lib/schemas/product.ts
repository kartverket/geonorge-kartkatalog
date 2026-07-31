import { z } from "zod";

export const ProductDistributionFormatSchema = z.object({
  name: z.string().nullable(),
  version: z.string().nullable(),
});

export const ProductKeywordSchema = z.object({
  keywordValue: z.string().nullable(),
  type: z.string().nullable(),
});

export const ProductDataQualityMeasureSchema = z.object({
  explanation: z.string().nullable(),
  quantitativeResult: z.number().nullable(),
  quantitativeResultValueUnit: z.string().nullable(),
  title: z.string().nullable(),
});

export const LegalConstraintsSchema = z.object({
  accessConstraints: z.string().nullable(),
  useConstraints: z.string().nullable(),
  useLimitations: z.array(z.string()),
  otherConstraintsLink: z.string().nullable(),
  otherConstraintsLinkText: z.string().nullable(),
  otherConstraintsAccess: z.string().nullable(),
});

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

export const DistributionGroupSchema = z.object({
  protocolName: z.string().nullable(),
  protocolDescription: z.string().nullable(),
  formats: z.array(z.string()),
  urls: z.array(z.string()),
  unitsOfDistribution: z.string().nullable(),
});

export type ReferenceSystem = z.infer<typeof ReferenceSystemSchema>;
export type DistributionGroup = z.infer<typeof DistributionGroupSchema>;

export const ProductMetadataSchema = z.object({
  title: z.string(),
  organization: z.string().nullable(),
  hierarchyLevel: z.string(),
  accessIsRestricted: z.boolean().nullable(),
  accessIsOpenData: z.boolean().nullable(),
  accessIsProtected: z.boolean().nullable(),
  dateUpdated: z.string().nullable(),
  maintenanceFrequency: z.string().nullable(),
  spatialRepresentation: z.string().nullable(),
  spatialScope: z.string().nullable(),
  resolutionScale: z.string().nullable(),
  keywordsTheme: z.array(ProductKeywordSchema),
  nationalKeywords: z.array(ProductKeywordSchema),
  distributionFormats: z.array(ProductDistributionFormatSchema),
  thumbnailUrl: z.string().nullable(),
  dataQualityMeasures: z.array(ProductDataQualityMeasureSchema),
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
});

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

export const ProductFairStatusSchema = z
  .object({
    FAIRStatusPerCent: z.number().nullable(),
    FindableStatusPerCent: z.number().nullable(),
    AccesibleStatusPerCent: z.number().nullable(),
    InteroperableStatusPerCent: z.number().nullable(),
    ReUseableStatusPerCent: z.number().nullable(),
  })
  .transform((status) => ({
    totalPercent: status.FAIRStatusPerCent,
    findablePercent: status.FindableStatusPerCent,
    accessiblePercent: status.AccesibleStatusPerCent,
    interoperablePercent: status.InteroperableStatusPerCent,
    reusablePercent: status.ReUseableStatusPerCent,
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
