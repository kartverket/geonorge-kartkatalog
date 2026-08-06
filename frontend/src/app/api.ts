import { notFound } from "next/navigation";
import { type Alerts, parseAlert } from "@/lib/schemas/alerts";
import {
  type ProductFairStatus,
  type ProductMetadata,
  parseProductFairStatus,
  parseProductMetadata,
} from "@/lib/schemas/product";
import {
  parseTegnereglerItem,
  TegnereglerItem,
} from "@/lib/schemas/tegneregler";

const API_BASE = process.env.API_BASE;
const REGISTER_BASE_URL = process.env.REGISTER_BASE_URL;

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, statusText: string, body: unknown) {
    super(`HTTP ${status} ${statusText}`);
    this.status = status;
    this.body = body;
  }
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
export async function getMetadata(uuid: string): Promise<ProductMetadata> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${API_BASE}/metadata/${encodeURIComponent(uuid)}`;
  // Fetch as unknown and validate the shape with Zod before returning typed data
  const body = await fetchJson(url, { method: "GET" });
  return parseProductMetadata(body);
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
 * Fetch alerts for a product by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export async function getTegneregler(
  uuid: string,
): Promise<TegnereglerItem | null> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${API_BASE}/documentation/tegneregler/${encodeURIComponent(uuid)}`;
  const body = await fetchJson(
    url,
    { method: "GET" },
    {
      notFoundOn404: false,
    },
  );
  console.log(body);
  if (body === null) return null;

  return parseTegnereglerItem(body);
}
