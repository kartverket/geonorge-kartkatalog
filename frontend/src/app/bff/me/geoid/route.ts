import { type NextRequest, NextResponse } from "next/server";
import { getGeoIdAuthInfo, HttpError } from "@/app/api";
import { clearAuthProviderCookie } from "../../auth/providerCookie";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") ?? undefined;
    const authInfo = await getGeoIdAuthInfo(cookie);
    return NextResponse.json({ authenticated: true, user: authInfo });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      if (error.status === 401) {
        const response = NextResponse.json({ authenticated: false });
        clearAuthProviderCookie(response);
        return response;
      }

      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not fetch authentication information." },
      { status: 500 },
    );
  }
}
