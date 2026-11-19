import { type NextRequest, NextResponse } from "next/server";
import { getKatalogUrl } from "@/app/api";
import { setAuthProviderCookie } from "../../providerCookie";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(getKatalogUrl("/beta"));
  if (request.cookies.has("BearerToken")) {
    setAuthProviderCookie(response, "ansattporten");
  }
  return response;
}
