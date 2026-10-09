import { NextResponse } from "next/server";
import { setAuthProviderCookie } from "../../providerCookie";

const BASE_URL = process.env.KATALOG_BASE_URL;

export function GET() {
  const response = NextResponse.redirect(new URL("/beta", BASE_URL));
  setAuthProviderCookie(response, "ansattporten");
  return response;
}
