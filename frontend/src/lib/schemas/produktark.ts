import { z } from "zod";

export const ProduktarkItemSchema = z.object({
  id: z.string().nullable(),
  label: z.string().nullable(),
  status: z.string().nullable(),
  owner: z.string().nullable(),
  dateSubmitted: z.string().nullable(),
  documentreference: z.string().nullable(),
});

export type ProduktarkItem = z.infer<typeof ProduktarkItemSchema>;

export function parseProduktarkItem(body: unknown): ProduktarkItem {
  const res = ProduktarkItemSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid produktark from server", {
      cause: res.error,
    });
  }

  return res.data;
}

