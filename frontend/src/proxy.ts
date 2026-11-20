import { type NextRequest, NextResponse } from "next/server";
import {
  isLocale,
  LOCALE_COOKIE_NAME,
  matchAcceptLanguage,
  withLocale,
} from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split("/")[1])) return;

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : matchAcceptLanguage(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = withLocale(pathname, locale);
  const response = NextResponse.redirect(url);
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  matcher: [
    "/",
    "/((?!_next|bff|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.[^/]+$).*)",
  ],
};
