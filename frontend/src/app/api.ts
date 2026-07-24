import { notFound } from "next/navigation";
import {
  type ProductMetadataInfo,
  type ProductMetadataSummary,
  parseProductMetadataInfo,
  parseProductMetadataSummary,
} from "@/lib/schemas/product";

const API_BASE = "http://localhost:8080";

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
  timeout = 8000,
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
      notFound();
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
 * Fetch metadata summary for a dataset by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export async function getMetadataSummary(
  uuid: string,
): Promise<ProductMetadataSummary> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${API_BASE}/metadata/summary/${encodeURIComponent(uuid)}`;
  // Fetch as unknown and validate the shape with Zod before returning typed data
  const body = await fetchJson(url, { method: "GET" });
  return parseProductMetadataSummary(body);
}

/**
 * Fetch metadata info for a dataset by UUID.
 * Intended for server-side usage (Next.js server components / getServerSideProps, etc.).
 */
export async function getMetadataInfo(
  uuid: string,
): Promise<ProductMetadataInfo> {
  if (!uuid) throw new Error("uuid is required");
  const url = `${API_BASE}/metadata/info/${encodeURIComponent(uuid)}`;
  const body = await fetchJson(url, { method: "GET" });
  return parseProductMetadataInfo(body);
}
