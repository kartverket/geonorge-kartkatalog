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

// TODO: tror egentlig mange av disse verdiene egentlig kommer inn som null, burde mappe nullverdier til noe annet i stedet for å bruke default
export const ProductMetadataSummarySchema = z.object({
  title: z.string().default("Ingen tittel"),
  organization: z.string().default("Ingen organisasjon"),
  hierarchyLevel: z.string().nullable().optional(),
  accessIsRestricted: z.boolean().nullable().optional(),
  accessIsOpenData: z.boolean().default(true),
  accessIsProtected: z.boolean().nullable().optional(),
  // dateUpdated will be returned as Date | null | undefined
  dateUpdated: z.string().default("-"),
  maintenanceFrequency: z.string().default("-"),
  spatialRepresentation: z.string().default("-"),
  spatialScope: z.string().default("-"),
  resolutionScale: z.string().default("-"),
  keywordsTheme: z.array(ProductKeywordSchema).default([]),
  nationalKeywords: z.array(ProductKeywordSchema).default([]),
  distributionFormats: z
    .array(ProductDistributionFormatSchema)
    .default([]),
  thumbnailUrl: z.string().nullable(),
  dataQualityMeasures: z
    .array(ProductDataQualityMeasureSchema)
    .nullable()
    .optional(),
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
