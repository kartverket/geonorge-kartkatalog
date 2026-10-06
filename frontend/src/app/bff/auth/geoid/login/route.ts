import { NextResponse } from "next/server";
import { startGeoIdLogin } from "@/app/api";
import { setAuthProviderCookie } from "../../providerCookie";

export async function GET() {
  const backendResponse = await startGeoIdLogin();
  const location = backendResponse.headers.get("location");

  if (
    !location ||
    backendResponse.status < 300 ||
    backendResponse.status >= 400
  ) {
    return NextResponse.json(
      { error: "Could not start GeoID login." },
      { status: 502 },
    );
  }

  const response = NextResponse.redirect(location, backendResponse.status);
  setAuthProviderCookie(response, "geoid");
  for (const cookie of backendResponse.headers.getSetCookie()) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}
