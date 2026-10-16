import { z } from "zod";

const FeatureInfoTextSchema = z.object({
  _text: z.string(),
});

const FeatureInfoBoxSchema = z.object({
  _attributes: z.object({
    srsName: z.string(),
  }),
  "gml:coordinates": FeatureInfoTextSchema,
});

const FeatureInfoFeatureSchema = z.object({
  "gml:boundedBy": z.object({
    "gml:Box": FeatureInfoBoxSchema,
  }),
});

const DatasetCoverageFeatureInfoSchema = z.union([
  FeatureInfoFeatureSchema.extend({
    objid: FeatureInfoTextSchema,
  }),
  FeatureInfoFeatureSchema.extend({
    kommunenr: FeatureInfoTextSchema,
    navn: FeatureInfoTextSchema,
  }),
]);

export const FeatureInfoResultSchema = z.object({
  _declaration: z.object({
    _attributes: z.object({
      version: z.string(),
      encoding: z.string(),
    }),
  }),
  msGMLOutput: z.object({
    _attributes: z.object({
      "xmlns:gml": z.string(),
      "xmlns:xlink": z.string(),
      "xmlns:xsi": z.string(),
    }),
    datasett_dekning_layer: z.object({
      "gml:name": FeatureInfoTextSchema,
      datasett_dekning_feature: DatasetCoverageFeatureInfoSchema,
    }),
  }),
});

export type FeatureInfoText = z.infer<typeof FeatureInfoTextSchema>;
export type DatasetCoverageFeatureInfo = z.infer<
  typeof DatasetCoverageFeatureInfoSchema
>;
export type FeatureInfoResult = z.infer<typeof FeatureInfoResultSchema>;
export type FeatureInfoResults = (FeatureInfoResult | null)[];

export function parseFeatureInfoResult(
  body: unknown,
): FeatureInfoResult | null {
  const result = FeatureInfoResultSchema.safeParse(body);
  if (!result.success) {
    console.warn("Invalid feature info result:", result.error);
    return null;
  }

  return result.data;
}
