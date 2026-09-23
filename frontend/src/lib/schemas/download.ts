import { z } from "zod";

export const NedlastingAreaSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.string().nullable(),
});

export const NedlastingProjectionSchema = z.object({
  code: z.string(),
  name: z.string(),
  codespace: z.string().nullable(),
});

export const DownloadFormatOptionSchema = z.object({
  name: z.string(),
  projections: z.array(NedlastingProjectionSchema),
});

export const DownloadOptionsSchema = z.object({
  areas: z.array(NedlastingAreaSchema),
  formats: z.array(DownloadFormatOptionSchema),
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

const NedlastingOrderFileSchema = z.object({
  status: z.string(),
  downloadUrl: z.string().nullable(),
  name: z.string().nullable(),
  areaName: z.string().nullable(),
  projectionName: z.string().nullable(),
  format: z.string().nullable(),
  metadataUuid: z.string().nullable(),
  metadataName: z.string().nullable(),
});

const NedlastingOrderResponseSchema = z.object({
  files: z.array(NedlastingOrderFileSchema),
});

export const DownloadOrderResultSchema = z.object({
  orders: z.array(NedlastingOrderResponseSchema),
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

export type DownloadOrderItemInput = {
  uuid: string;
  areas?: Array<{ code: string; name: string; type?: string | null }>;
  projections?: Array<{
    code: string;
    name: string;
    codespace?: string | null;
  }>;
  formats?: Array<{ name: string }>;
};
