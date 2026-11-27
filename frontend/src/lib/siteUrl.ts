import { basePath } from "@/lib/basePath";

const SITE_ORIGIN = "https://kartkatalog.geonorge.no";

export function siteUrl(path = "/"): string {
  return new URL(`${basePath}${path}`, SITE_ORIGIN).toString();
}
