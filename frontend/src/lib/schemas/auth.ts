import { z } from "zod";

const UpstreamAuthInfoSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
    preferred_username: z.string(),
  })
  .transform(({ name, email, preferred_username }) => ({
    name,
    email,
    preferredUsername: preferred_username,
  }));

export const AuthInfoSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  preferredUsername: z.string(),
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
  return AuthInfoSchema.parse(UpstreamAuthInfoSchema.parse(body));
}
