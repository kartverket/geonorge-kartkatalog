import { type NextRequest, NextResponse } from "next/server";
import { getKatalogUrl, KATALOG_ORIGIN, startLogout } from "@/app/api";
import { basePath } from "@/lib/basePath";
import {
  clearAuthProviderCookie,
  resolveAuthProvider,
} from "../providerCookie";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== KATALOG_ORIGIN) {
    return NextResponse.json(
      { error: "Invalid logout origin." },
      { status: 403 },
    );
  }

  const provider = resolveAuthProvider(request);

  if (provider === "ansattporten") {
    const response = NextResponse.redirect(
      getKatalogUrl(`${basePath}/bff/auth/ansattporten/logout`),
      303,
    );
    clearAuthProviderCookie(response);
    return response;
  }

  if (!provider) {
    const response = NextResponse.redirect(
      getKatalogUrl(basePath ? `${basePath}/` : "/"),
    );
    clearAuthProviderCookie(response);
    return response;
  }

  const backendResponse = await startLogout(
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
