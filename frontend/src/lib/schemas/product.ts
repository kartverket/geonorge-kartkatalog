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

export const ProductMetadataSummarySchema = z.object({
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
});

export type ProductMetadataSummary = z.infer<
  typeof ProductMetadataSummarySchema
>;

export function parseProductMetadataSummary(
  body: unknown,
): ProductMetadataSummary {
  const res = ProductMetadataSummarySchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid metadata summary from server", {
      cause: res.error,
    });
  }

  return res.data;
}

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

export const ProductMetadataInfoSchema = z.object({
  abstractText: z.string().nullable(),
  purpose: z.string().nullable(),
  specificUsage: z.string().nullable(),
  processHistory: z.string().nullable(),
  constraints: LegalConstraintsSchema.nullable(),
  securityClassification: z.string().nullable(),
  contactMetadata: ProductMetadataContactSchema.nullable(),
  contactOwner: ProductMetadataContactSchema.nullable(),
  contactPublisher: ProductMetadataContactSchema.nullable(),
});

export type ProductMetadataInfo = z.infer<typeof ProductMetadataInfoSchema>;

export function parseProductMetadataInfo(body: unknown): ProductMetadataInfo {
  const res = ProductMetadataInfoSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid metadata info from server", { cause: res.error });
  }
  return res.data;
}

export const ProductFairStatusSchema = z.object({
  totalPercent: z.number().nullable(),
  findablePercent: z.number().nullable(),
  accessiblePercent: z.number().nullable(),
  interoperablePercent: z.number().nullable(),
  reusablePercent: z.number().nullable(),
});

export type ProductFairStatus = z.infer<typeof ProductFairStatusSchema>;

export function parseProductFairStatus(body: unknown): ProductFairStatus {
  const res = ProductFairStatusSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid FAIR status from server", { cause: res.error });
  }
  return res.data;
}
