import { z } from "zod";

export const TegnereglerItemSchema = z.object({
  id: z.string().nullable(),
  label: z.string().nullable(),
  lang: z.string().nullable(),
  itemClass: z.string().nullable(),
  uuid: z.string().nullable(),
  status: z.string().nullable(),
  description: z.string().nullable(),
  seoname: z.string().nullable(),
  owner: z.string().nullable(),
  versionNumber: z.number().int().nullable(),
  lastUpdated: z.string().nullable(),
  dateSubmitted: z.string().nullable(),
  dateAccepted: z.string().nullable(),
  cartographyFile: z.string().nullable(),
  draftDate: z.string().nullable(),
  thumbnail: z.string().nullable(),
  documentreference: z.string().nullable(),
  fairStatusPerCent: z.number().nullable(),
});

export type TegnereglerItem = z.infer<typeof TegnereglerItemSchema>;

export function parseTegnereglerItem(body: unknown): TegnereglerItem {
  const res = TegnereglerItemSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid tegneregler from server", {
      cause: res.error,
    });
  }

  return res.data;
}
