import { z } from "zod";

export const ProduktspesifikasjonItemSchema = z.object({
  id: z.string().nullable(),
  label: z.string().nullable(),
  status: z.string().nullable(),
  owner: z.string().nullable(),
  dateSubmitted: z.string().nullable(),
  gmlApplicationSchema: z.string().nullable(),
  applicationSchema: z.string().nullable(),
  documentreference: z.string().nullable(),
});

export type ProduktspesifikasjonItem = z.infer<
  typeof ProduktspesifikasjonItemSchema
>;

export function parseProduktspesifikasjonItem(
  body: unknown,
): ProduktspesifikasjonItem {
  const res = ProduktspesifikasjonItemSchema.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid produktspesifikasjon from server", {
      cause: res.error,
    });
  }

  return res.data;
}
