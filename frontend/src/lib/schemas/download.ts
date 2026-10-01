import { z } from "zod";

export const DownloadProjectionSchema = z.object({
  code: z.string(),
  name: z.string(),
  codespace: z.string().nullable(),
});

export const DownloadFormatOptionSchema = z.object({
  name: z.string(),
});

export const DownloadProjectionOptionSchema = DownloadProjectionSchema.extend({
  formats: z.array(DownloadFormatOptionSchema),
});

export const DownloadAreaSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.string().nullable(),
});

export const DownloadAreaOptionSchema = z.object({
  area: DownloadAreaSchema,
  projections: z.array(DownloadProjectionOptionSchema),
});

export const DownloadOptionsSchema = z.object({
  areas: z.array(DownloadAreaOptionSchema),
});

export type DownloadOptions = z.infer<typeof DownloadOptionsSchema>;

export function parseDownloadOptions(body: unknown): DownloadOptions {
  const res = DownloadOptionsSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid download options from server", {
      cause: res.error,
    });
  }
  return res.data;
}

const DownloadOrderFileSchema = z.object({
  status: z.string(),
  downloadUrl: z.string().nullable(),
  name: z.string().nullable(),
  areaName: z.string().nullable(),
  projectionName: z.string().nullable(),
  format: z.string().nullable(),
  metadataUuid: z.string().nullable(),
  metadataName: z.string().nullable(),
});

const DownloadOrderGroupResultSchema = z.object({
  status: z.enum(["ordered", "failed"]),
  files: z.array(DownloadOrderFileSchema),
  metadataUuids: z.array(z.string()),
  message: z.string().nullable(),
});

export const DownloadOrderResultSchema = z.object({
  orders: z.array(DownloadOrderGroupResultSchema),
});

export type DownloadOrderResult = z.infer<typeof DownloadOrderResultSchema>;

export function parseDownloadOrderResult(body: unknown): DownloadOrderResult {
  const res = DownloadOrderResultSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid download order result from server", {
      cause: res.error,
    });
  }
  return res.data;
}

export const DownloadOrderAreaInputSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    type: z.string().nullable(),
  })
  .strict();

export const DownloadOrderProjectionInputSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    codespace: z.string().nullable(),
  })
  .strict();

export const DownloadOrderFormatInputSchema = z
  .object({
    name: z.string().min(1),
  })
  .strict();

export const DownloadOrderItemInputSchema = z
  .object({
    uuid: z.string().min(1),
    areas: z.array(DownloadOrderAreaInputSchema).min(1),
    projections: z.array(DownloadOrderProjectionInputSchema).min(1),
    formats: z.array(DownloadOrderFormatInputSchema).min(1),
  })
  .strict();

const DownloadOrderRequestItemSchema = DownloadOrderItemInputSchema.extend({
  usagePurpose: z.array(z.string().min(1)).min(1),
}).strict();

export const DownloadOrderRequestSchema = z
  .object({
    email: z.string().email(),
    usageGroup: z.string().min(1),
    items: z.array(DownloadOrderRequestItemSchema).min(1),
  })
  .strict();

export type DownloadOrderAreaInput = z.infer<
  typeof DownloadOrderAreaInputSchema
>;
export type DownloadOrderProjectionInput = z.infer<
  typeof DownloadOrderProjectionInputSchema
>;
export type DownloadOrderItemInput = z.infer<
  typeof DownloadOrderItemInputSchema
>;
export type DownloadOrderRequest = z.infer<typeof DownloadOrderRequestSchema>;

export function parseDownloadOrderRequest(body: unknown): DownloadOrderRequest {
  return DownloadOrderRequestSchema.parse(body);
}

export const DownloadInsightGroupsSchema = z.object({
  formal: z.array(z.string()),
  brukergrupper: z.array(z.string()),
});

export type DownloadInsightGroups = z.infer<typeof DownloadInsightGroupsSchema>;

export function parseDownloadInsightGroups(
  body: unknown,
): DownloadInsightGroups {
  const res = DownloadInsightGroupsSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid download insight groups from server", {
      cause: res.error,
    });
  }
  return res.data;
}
