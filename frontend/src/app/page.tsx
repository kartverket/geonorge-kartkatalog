import { getServerConsent } from "@cookieyes/nextjs/server";
import { cookies } from "next/headers";
import { RESERVED_SEARCH_PARAMS } from "@/lib/facets";
import type { DatasetCardData } from "@/lib/types/dataset";
import { SearchHero } from "./_components/SearchHero/SearchHero";
import { SearchResults } from "./_components/SearchResults/SearchResults";
import {
  isViewMode,
  VIEW_MODE_COOKIE_NAME,
} from "./_components/SearchResults/viewMode";
import { getSearchResults } from "./api";

export const instant = false;
const PAGE_SIZE = 20;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [cookieStore, consent] = await Promise.all([
    cookies(),
    getServerConsent({ regulation: "GDPR" }),
  ]);
  const storedViewMode = consent?.categories.performance
    ? cookieStore.get(VIEW_MODE_COOKIE_NAME)?.value
    : undefined;
  // TODO: kan man skrive noe sånt som dette? const { text, orderby } = await searchParams;
  const sp = await searchParams;
  const text = typeof sp.text === "string" ? sp.text : undefined;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const orderby = typeof sp.orderby === "string" ? sp.orderby : undefined;

  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (RESERVED_SEARCH_PARAMS.has(key) || value == null) continue;
    filters[key] = Array.isArray(value) ? value : [value];
  }
  const searchResult = await getSearchResults({
    text,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    orderby: orderby || "score",
    filters: filters,
  });
  const results: DatasetCardData[] = searchResult.results;

  return (
    <>
      <SearchHero initialValue={text ?? ""} />
      <SearchResults
        initialViewMode={isViewMode(storedViewMode) ? storedViewMode : "grid"}
        initialResults={results}
        currentPage={page}
        totalCount={searchResult.numFound}
        pageSize={PAGE_SIZE}
        searchText={text ?? ""}
        orderby={orderby || "score"}
        facets={searchResult.facets}
      />
    </>
  );
}
