import { z } from "zod";

export const TegnereglerItemSchema = z.object({
  id: z.string().nullable(),
  label: z.string().nullable(),
  status: z.string().nullable(),
  owner: z.string().nullable(),
  dateSubmitted: z.string().nullable(),
  documentreference: z.string().nullable(),
  cartographyFile: z.string().nullable(),
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
