import { z } from "zod";

export const AuthInfoSchema = z.object({
  name: z.string(),
  organizationName: z.string().nullable(),
});

export const AuthSessionSchema = z.discriminatedUnion("authenticated", [
  z.object({ authenticated: z.literal(false) }),
  z.object({
    authenticated: z.literal(true),
    user: AuthInfoSchema,
  }),
]);

export type AuthInfo = z.infer<typeof AuthInfoSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export function parseAuthInfo(body: unknown): AuthInfo {
  return AuthInfoSchema.parse(body);
}
