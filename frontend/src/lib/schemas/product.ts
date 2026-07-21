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

const DateOrUndefined = z.preprocess((val) => {
  if (val === null) return null;
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return val;
}, z.date().nullable().optional());

export const ProductMetadataSummarySchema = z.object({
  title: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  hierarchyLevel: z.string().nullable().optional(),
  accessIsRestricted: z.boolean().nullable().optional(),
  accessIsOpenData: z.boolean().nullable().optional(),
  accessIsProtected: z.boolean().nullable().optional(),
  // dateUpdated will be returned as Date | null | undefined
  dateUpdated: DateOrUndefined,
  maintenanceFrequency: z.string().nullable().optional(),
  spatialRepresentation: z.string().nullable().optional(),
  spatialScope: z.string().nullable().optional(),
  resolutionScale: z.string().nullable().optional(),
  keywordsTheme: z.array(ProductKeywordSchema).nullable().optional(),
  nationalKeywords: z.array(ProductKeywordSchema).nullable().optional(),
  distributionFormats: z.array(ProductDistributionFormatSchema).nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  dataQualityMeasures: z.array(ProductDataQualityMeasureSchema).nullable().optional(),
});


export type ProductMetadataSummary = z.infer<typeof ProductMetadataSummarySchema>;

export function parseProductMetadataSummary(body: unknown): ProductMetadataSummary {
  const res = ProductMetadataSummarySchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid metadata summary from server", { cause: res.error });
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
    // eslint-disable-next-line no-console
    console.error("ProductMetadataInfo validation failed", res.error.format());
    throw new Error("Invalid metadata info from server");
  }
  return res.data;
}

