export const AUTH_PROVIDER_COOKIE_NAME = "KARTKATALOG_AUTH_PROVIDER";

export type AuthProvider = "geoid" | "ansattporten";

export function isAuthProvider(value: string): value is AuthProvider {
  return value === "geoid" || value === "ansattporten";
}
