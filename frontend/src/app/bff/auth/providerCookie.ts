import type { NextRequest, NextResponse } from "next/server";
import {
  AUTH_PROVIDER_COOKIE_NAME,
  type AuthProvider,
  isAuthProvider,
} from "@/lib/authProvider";
import { basePath } from "@/lib/basePath";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: basePath || "/",
};

export function resolveAuthProvider(request: NextRequest): AuthProvider | null {
  const provider = request.cookies.get(AUTH_PROVIDER_COOKIE_NAME)?.value;

  if (provider && isAuthProvider(provider)) {
    return provider;
  }

  let providerFromSession = request.cookies.has("GEOID_SESSION")
    ? "geoid"
    : null;
  if (!providerFromSession) {
    providerFromSession = request.cookies.has("BearerToken")
      ? "ansattporten"
      : null;
  }
  return providerFromSession as AuthProvider | null;
}

export function setAuthProviderCookie(
  response: NextResponse,
  provider: AuthProvider,
) {
  response.cookies.set(AUTH_PROVIDER_COOKIE_NAME, provider, COOKIE_OPTIONS);
}

export function clearAuthProviderCookie(response: NextResponse) {
  response.cookies.set(AUTH_PROVIDER_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    expires: new Date(0),
    maxAge: 0,
  });
}
