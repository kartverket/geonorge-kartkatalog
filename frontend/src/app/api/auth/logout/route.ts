import { type NextRequest, NextResponse } from "next/server";
import { startLogout } from "@/app/api";
import { basePath } from "@/lib/basePath";
import {
  clearAuthProviderCookie,
  resolveAuthProvider,
} from "../providerCookie";

export async function GET(request: NextRequest) {
  const provider = resolveAuthProvider(request);

  if (!provider) {
    const response = NextResponse.redirect(
      new URL(basePath ? `${basePath}/` : "/", request.url),
    );
    clearAuthProviderCookie(response);
    return response;
  }

  const backendResponse = await startLogout(
    provider,
    request.headers.get("cookie") ?? undefined,
  );
  const location = backendResponse.headers.get("location");

  if (
    !location ||
    backendResponse.status < 300 ||
    backendResponse.status >= 400
  ) {
    return NextResponse.json(
      { error: `Could not log out from ${provider}.` },
      { status: 502 },
    );
  }

  const response = NextResponse.redirect(location, backendResponse.status);
  clearAuthProviderCookie(response);
  for (const cookie of backendResponse.headers.getSetCookie()) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}
