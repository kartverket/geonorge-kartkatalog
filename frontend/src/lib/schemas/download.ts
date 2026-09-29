import { z } from "zod";

export const DownloadProjectionSchema = z.object({
  code: z.string(),
  name: z.string(),
  codespace: z.string().nullable(),
});

export const DownloadFormatOptionSchema = z.object({
  name: z.string(),
  projections: z.array(DownloadProjectionSchema),
});

export const DownloadAreaSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.string().nullable(),
});

export const DownloadAreaOptionSchema = z.object({
  area: DownloadAreaSchema,
  projections: z.array(DownloadProjectionSchema),
  formats: z.array(DownloadFormatOptionSchema),
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

const DownloadOrderResponseSchema = z.object({
  files: z.array(DownloadOrderFileSchema),
});

export const DownloadOrderResultSchema = z.object({
  orders: z.array(DownloadOrderResponseSchema),
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

export type DownloadOrderAreaInput = z.infer<typeof DownloadAreaSchema>;

export type DownloadOrderItemInput = {
  uuid: string;
  areas?: DownloadOrderAreaInput[];
  projections?: Array<{
    code: string;
    name: string;
    codespace?: string | null;
  }>;
  formats?: Array<{ name: string }>;
  usagePurpose?: string[];
};

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
