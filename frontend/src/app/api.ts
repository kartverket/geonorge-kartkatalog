import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { AuthProvider } from "@/lib/authProvider";
import { basePath } from "@/lib/basePath";
import { type Alerts, parseAlert } from "@/lib/schemas/alerts";
import { type AuthInfo, parseAuthInfo } from "@/lib/schemas/auth";
import {
  type DownloadInsightGroups,
  type DownloadOptions,
  type DownloadOrderRequest,
  type DownloadOrderResult,
  parseDownloadInsightGroups,
  parseDownloadOptions,
  parseDownloadOrderResult,
} from "@/lib/schemas/download";
import {
  type LinkedDistributions,
  type ProductFairStatus,
  type ProductMetadata,
  parseLinkedDistributions,
  parseProductFairStatus,
  parseProductMetadata,
} from "@/lib/schemas/product";
import {
  type ProduktarkItem,
  parseProduktarkItem,
} from "@/lib/schemas/produktark";
import {
  type ProduktspesifikasjonItem,
  parseProduktspesifikasjonItem,
} from "@/lib/schemas/produktspesifikasjon";
import { parseSearchResult, type SearchResult } from "@/lib/schemas/search";
import {
  parseTegnereglerItem,
  type TegnereglerItem,
} from "@/lib/schemas/tegneregler";

const API_BASE = process.env.API_BASE;
const REGISTER_BASE_URL = process.env.REGISTER_BASE_URL;
const katalogBaseUrl: string | undefined = process.env.KATALOG_BASE_URL;
const KATALOG_ORIGIN = new URL(katalogBaseUrl ?? "https://dummy.org").origin;

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, statusText: string, body: unknown) {
    super(`HTTP ${status} ${statusText}`);
    this.status = status;
    this.body = body;
  }
}

async function startAuthAction(
  provider: AuthProvider,
  action: "login" | "logout",
  cookie?: string,
) {
  return fetch(`${API_BASE}/auth/${provider}/${action}`, {
    method: action === "logout" ? "POST" : "GET",
    headers: {
      Origin: KATALOG_ORIGIN,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    redirect: "manual",
    cache: "no-store",
  });
}

function geoIdRequestHeaders(cookie?: string) {
  const publicUrl = new URL(KATALOG_ORIGIN);
  return {
    Origin: KATALOG_ORIGIN,
    "X-Forwarded-Host": publicUrl.host,
    "X-Forwarded-Proto": publicUrl.protocol.slice(0, -1),
    "X-Forwarded-Port":
      publicUrl.port || (publicUrl.protocol === "https:" ? "443" : "80"),
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

export async function startGeoIdLogin(): Promise<Response> {
  return fetch(`${API_BASE}/auth/geoid/login`, {
    headers: geoIdRequestHeaders(),
    redirect: "manual",
    cache: "no-store",
  });
}

export async function startAnsattportenLogin(): Promise<Response> {
  return startAuthAction("ansattporten", "login");
}

export async function startLogout(
  provider: AuthProvider,
  cookie?: string,
): Promise<Response> {
  return startAuthAction(provider, "logout", cookie);
}

export async function geoIdCallback(
  search: string,
  cookie?: string,
): Promise<Response> {
  const callbackUrl = new URL(`${basePath}/api/auth/geoid/callback`, API_BASE);
  callbackUrl.search = search;

  return fetch(callbackUrl, {
    method: "GET",
    headers: geoIdRequestHeaders(cookie),
    redirect: "manual",
    cache: "no-store",
  });
}

async function fetchJson(
  url: string,
  options: RequestInit = {},
  { timeout = 8000, notFoundOn404 = true } = {},
): Promise<unknown> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    clearTimeout(id);

    const contentType = res.headers.get("content-type") || "";
    let body: unknown = null;
    if (contentType.includes("application/json")) {
      body = await res.json();
    } else {
      // Fallback to text for non-json responses (useful for error messages)
      body = await res.text();
    }

    if (res.status === 404) {
      if (notFoundOn404) {
        notFound();
      } else return null;
    }

    if (!res.ok) {
      throw new HttpError(res.status, res.statusText, body);
    }
    return body;
  } catch (err: unknown) {
    clearTimeout(id);
    // AbortError when fetch is aborted in Node/Browser has different shapes; check name via typed guard
    const maybeErr = err as { name?: string } | undefined;
    if (maybeErr?.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    throw err;
  }
}

/**
 * Fetch metadata for a dataset by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export const getMetadata = cache(
  async (uuid: string, notFoundOn404 = true): Promise<ProductMetadata> => {
    if (!uuid) throw new Error("uuid is required");
    const url = `${API_BASE}/metadata/${encodeURIComponent(uuid)}`;
    // Fetch as unknown and validate the shape with Zod before returning typed data
    const body = await fetchJson(url, { method: "GET" }, { notFoundOn404 });
    return parseProductMetadata(body);
  },
);

/**
 * Fetch linked distributions (applications, view services,
 download services) for a dataset by UUID.
 * Intended for server-side usage (Next.js server components).
 */
export async function getLinkedDistributions(
  uuid: string,
): Promise<LinkedDistributions> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${API_BASE}/metadata/${encodeURIComponent(uuid)}/linked-distributions`;
  const body = await fetchJson(
    url,
    { method: "GET" },
    { notFoundOn404: false },
  );
  return parseLinkedDistributions(body);
}

/**
 * Fetch FAIR status for a dataset by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export async function getFairStatus(
  uuid: string,
): Promise<ProductFairStatus | null> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${REGISTER_BASE_URL}/api/fair/${encodeURIComponent(uuid)}`;
  const body = await fetchJson(
    url,
    { method: "GET" },
    {
      notFoundOn404: false,
    },
  );
  if (body === null) return null;
  return parseProductFairStatus(body);
}

/**
 * Fetch alerts for a product by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export async function getProductAlerts(uuid: string): Promise<Alerts | null> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${REGISTER_BASE_URL}/api/alerts/${encodeURIComponent(uuid)}`;
  const body = await fetchJson(
    url,
    { method: "GET" },
    {
      notFoundOn404: false,
    },
  );
  if (body === null) return null;

  return parseAlert(body);
}

/**
 * Fetch produktark (product sheet) for a product by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export async function getProduktark(
  uuid: string,
): Promise<ProduktarkItem | null> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${API_BASE}/metadata/${encodeURIComponent(uuid)}/produktark`;
  const body = await fetchJson(
    url,
    { method: "GET" },
    {
      notFoundOn404: false,
    },
  );
  if (body === null) return null;

  return parseProduktarkItem(body);
}

/**
 * Fetch produktspesifikasjon (product specification) for a product by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export async function getProduktspesifikasjon(
  uuid: string,
): Promise<ProduktspesifikasjonItem | null> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${API_BASE}/metadata/${encodeURIComponent(uuid)}/produktspesifikasjon`;
  const body = await fetchJson(
    url,
    { method: "GET" },
    {
      notFoundOn404: false,
    },
  );
  if (body === null) return null;

  return parseProduktspesifikasjonItem(body);
}

/**
 * Fetch tegneregler (cartography rules) for a product by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export async function getTegneregler(
  uuid: string,
): Promise<TegnereglerItem | null> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${API_BASE}/metadata/${encodeURIComponent(uuid)}/tegneregler`;
  const body = await fetchJson(
    url,
    { method: "GET" },
    {
      notFoundOn404: false,
    },
  );
  if (body === null) return null;

  return parseTegnereglerItem(body);
}

export async function getSearchResults({
  text,
  limit = 25,
  offset = 1,
  orderby = "score",
  filters = {},
}: {
  text?: string;
  limit?: number;
  offset?: number;
  orderby?: string;
  filters?: Record<string, string[]>;
}): Promise<SearchResult> {
  const params = new URLSearchParams();
  if (text?.trim()) params.set("text", text.trim());
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.set("orderby", orderby);

  let i = 0;
  for (const [field, values] of Object.entries(filters)) {
    for (const value of values) {
      params.set(`facets[${i}]name`, field);
      params.set(`facets[${i}]value`, value);
      i++;
    }
  }

  const url = `${API_BASE}/api/search?${params.toString()}`;
  const body = await fetchJson(url, { method: "GET" });
  return parseSearchResult(body);
}

export async function getDownloadOptions(
  uuid: string,
  capabilitiesUrl: string,
): Promise<DownloadOptions> {
  if (!uuid) throw new Error("uuid is required");
  const params = new URLSearchParams();
  if (capabilitiesUrl) params.set("capabilitiesUrl", capabilitiesUrl);
  const query = params.toString();
  const url = `${API_BASE}/api/download/options/${encodeURIComponent(uuid)}${query ? `?${query}` : ""}`;
  const body = await fetchJson(url, { method: "GET" });
  return parseDownloadOptions(body);
}

export async function orderDownload(
  request: DownloadOrderRequest,
  cookie?: string,
): Promise<DownloadOrderResult> {
  const url = `${API_BASE}/api/download/order`;
  const body = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: KATALOG_ORIGIN,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(request),
  });
  return parseDownloadOrderResult(body);
}

export async function getDownloadInsightGroups(): Promise<DownloadInsightGroups> {
  "use cache";
  cacheLife("days");

  const url = `${API_BASE}/api/download/insight-groups`;
  const body = await fetchJson(url, {
    method: "GET",
  });
  return parseDownloadInsightGroups(body);
}

export async function getAuthInfo(
  provider: AuthProvider,
  cookie?: string,
): Promise<AuthInfo> {
  const path = provider === "geoid" ? "/api/me/geoid" : "/api/me";
  const body = await fetchJson(`${API_BASE}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Origin: KATALOG_ORIGIN,
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });

  return parseAuthInfo(body);
}
