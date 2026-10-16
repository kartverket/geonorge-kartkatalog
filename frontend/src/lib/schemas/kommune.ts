import { z } from "zod";

export const KommuneSchema = z.object({
  kommunenummer: z.string(),
  kommunenavn: z.string(),
  kommunenavnNorsk: z.string(),
});

export const KommunerSchema = z.array(KommuneSchema);

export type Kommune = z.infer<typeof KommuneSchema>;

export function parseKommuner(body: unknown): Kommune[] {
  const result = KommunerSchema.safeParse(body);
  if (!result.success) {
    throw new Error("Invalid municipalities from Kommuneinfo", {
      cause: result.error,
    });
  }

  return result.data;
}
