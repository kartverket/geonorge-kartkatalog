import { z } from "zod";

export const ProductDistributionFormatSchema = z.object({
  name: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
});

export const ProductKeywordSchema = z.object({
  keywordValue: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
});

export const ProductDataQualityMeasureSchema = z.object({
  explanation: z.string().nullable().optional(),
  quantitativeResult: z.number().nullable().optional(),
  quantitativeResultValueUnit: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

export const ProductMetadataSummarySchema = z.object({
  title: z.string().nullable().default("-"),
  organization: z.string().nullable().default("-"),
  hierarchyLevel: z.string().nullable().default("-"),
  accessIsRestricted: z.boolean().nullable().default(false),
  accessIsOpenData: z.boolean().nullable().default(true),
  accessIsProtected: z.boolean().nullable().default(false),
  // dateUpdated will be returned as Date | null | undefined
  dateUpdated: z.string().nullable(),
  maintenanceFrequency: z.string().nullable().default("-"),
  spatialRepresentation: z.string().nullable().default("-"),
  spatialScope: z.string().nullable().default("-"),
  resolutionScale: z.string().nullable().default("-"),
  keywordsTheme: z.array(ProductKeywordSchema).default([]),
  nationalKeywords: z.array(ProductKeywordSchema).default([]),
  distributionFormats: z.array(ProductDistributionFormatSchema).default([]),
  thumbnailUrl: z.string().nullable().default(null),
  dataQualityMeasures: z.array(ProductDataQualityMeasureSchema).default([]),
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

// ---------- ProductMetadataInfo and related schemas ----------
export const LegalConstraintsSchema = z.object({
  accessConstraints: z.string().nullable().optional(),
  useConstraints: z.string().nullable().optional(),
  useLimitations: z.array(z.string()).nullable().optional(),
  otherConstraintsLink: z.string().nullable().optional(),
  otherConstraintsLinkText: z.string().nullable().optional(),
  otherConstraintsAccess: z.string().nullable().optional(),
});

export const ProductMetadataContactSchema = z.object({
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  organizationEnglish: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
});

export const ProductMetadataInfoSchema = z.object({
  abstractText: z.string().nullable().optional(),
  specificUsage: z.string().nullable().optional(),
  constraints: LegalConstraintsSchema.nullable().optional(),
  contactMetadata: ProductMetadataContactSchema.nullable().optional(),
  contactOwner: ProductMetadataContactSchema.nullable().optional(),
  contactPublisher: ProductMetadataContactSchema.nullable().optional(),
});

export type ProductMetadataInfo = z.infer<typeof ProductMetadataInfoSchema>;

export function parseProductMetadataInfo(body: unknown): ProductMetadataInfo {
  const res = ProductMetadataInfoSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid metadata info from server", { cause: res.error });
  }
  return res.data;
}
