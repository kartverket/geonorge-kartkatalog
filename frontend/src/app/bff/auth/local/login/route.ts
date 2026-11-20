import { NextResponse } from "next/server";
import { getKatalogUrl } from "@/app/api";
import {
  setAuthProviderCookie,
  setBearerTokenCookie,
} from "@/app/bff/auth/providerCookie";

export async function GET() {
  const authBaseUrl = process.env.AUTH_BASE_URL;
  if (!authBaseUrl) {
    return new Response("AUTH_BASE_URL is not set", { status: 500 });
  }

  const tokenResponse = await fetch(new URL("/default/token", authBaseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "kartkatalog",
      client_secret: "x",
      scope: "test",
    }),
    cache: "no-store",
  });

  const resData = await tokenResponse.json();
  const response = NextResponse.redirect(getKatalogUrl("/beta"));

  if (resData.access_token) {
    setBearerTokenCookie(response, resData.access_token);
    setAuthProviderCookie(response, "mock");
  }

  return response;
}
