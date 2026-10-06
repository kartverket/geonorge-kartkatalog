import { type NextRequest, NextResponse } from "next/server";
import { geoIdCallback } from "@/app/api";

export async function GET(request: NextRequest) {
  const backendResponse = await geoIdCallback(
    request.nextUrl.search,
    request.headers.get("cookie") ?? undefined,
  );
  const location = backendResponse.headers.get("location");

  if (
    !location ||
    backendResponse.status < 300 ||
    backendResponse.status >= 400
  ) {
    return NextResponse.json(
      { error: "Could not complete GeoID login." },
      { status: 502 },
    );
  }

  const response = NextResponse.redirect(location, backendResponse.status);
  for (const cookie of backendResponse.headers.getSetCookie()) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}
