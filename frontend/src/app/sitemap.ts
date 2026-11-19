import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { getSearchResults } from "@/app/api";
import { basePath } from "@/lib/basePath";
import { DEFAULT_LOCALE, LOCALES, localizedPath } from "@/lib/i18n";

const SITE_ORIGIN = "https://kartkatalog.geonorge.no/beta";
const PAGE_SIZE = 1000;

function siteUrl(path = "/"): string {
  return new URL(`${basePath}${path}`, SITE_ORIGIN).toString();
}

async function getMetadataUrls(): Promise<MetadataRoute.Sitemap> {
  "use cache";

  cacheLife("days");

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
      url: siteUrl(
        // litt ekstra logikk for å få med oss riktig presentasjon av met.inst-id-er
        localizedPath(
          DEFAULT_LOCALE,
          `/metadata/${encodeURIComponent(uuid).replaceAll("%3A", ":")}`,
        ),
      ),
    })),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const languages = Object.fromEntries(
    LOCALES.map((locale) => [locale, siteUrl(localizedPath(locale, "/"))]),
  );
  const staticUrls: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: siteUrl(localizedPath(locale, "/")),
    alternates: { languages },
  }));

  return [...staticUrls, ...(await getMetadataUrls())];
}
