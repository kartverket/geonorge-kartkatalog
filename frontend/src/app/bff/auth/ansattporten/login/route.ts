import { type NextRequest, NextResponse } from "next/server";
import { setAuthProviderCookie } from "../../providerCookie";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/beta", request.url));
  setAuthProviderCookie(response, "ansattporten");
  return response;
}
