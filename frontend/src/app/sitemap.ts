import type { MetadataRoute } from "next";
import { getSearchResults } from "@/app/api";
import { basePath, isBeta } from "@/lib/basePath";

const SITE_ORIGIN = "https://kartkatalog.geonorge.no";
const PAGE_SIZE = 1000;

export const dynamic = "force-dynamic";

function siteUrl(path = "/"): string {
  return new URL(`${basePath}${path}`, SITE_ORIGIN).toString();
}

async function getMetadataUrls(): Promise<MetadataRoute.Sitemap> {
  const firstPage = await getSearchResults({
    limit: PAGE_SIZE,
    orderby: "title",
  });
  const offsets = Array.from(
    { length: Math.ceil(firstPage.numFound / PAGE_SIZE) - 1 },
    (_, index) => firstPage.offset + PAGE_SIZE * (index + 1),
  );
  const remainingPages = await Promise.all(
    offsets.map((offset) =>
      getSearchResults({ limit: PAGE_SIZE, offset, orderby: "title" }),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) =>
    page.results.map(({ uuid }) => ({
      url: siteUrl(`/metadata/${encodeURIComponent(uuid)}`),
    })),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [{ url: siteUrl() }];

  if (!isBeta) {
    staticUrls.push({ url: siteUrl("/nedlasting") });
  }

  return [...staticUrls, ...(await getMetadataUrls())];
}
