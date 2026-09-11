import { RESERVED_SEARCH_PARAMS } from "@/lib/facets";
import type { DatasetCardProps } from "./_components/DatasetCard/DatasetCard";
import { SearchHero } from "./_components/SearchHero/SearchHero";
import { SearchResults } from "./_components/SearchResults/SearchResults";
import { getSearchResults } from "./api";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const text = typeof sp.text === "string" ? sp.text : undefined;
  const offset = typeof sp.offset === "string" ? sp.offset : undefined;
  const limit = typeof sp.limit === "string" ? sp.limit : undefined;
  const orderby = typeof sp.orderby === "string" ? sp.orderby : undefined;

  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (RESERVED_SEARCH_PARAMS.has(key) || value == null) continue;
    filters[key] = Array.isArray(value) ? value : [value];
  }
  const searchResult = await getSearchResults({
    text,
    offset: Number(offset) || 1,
    limit: Number(limit) || 25,
    orderby: orderby || "score",
    filters: filters,
  });
  const results: Array<Omit<DatasetCardProps, "viewMode">> =
    searchResult.results;

  return (
    <>
      <SearchHero initialValue={text ?? ""} />
      <SearchResults
        initialResults={results}
        totalCount={searchResult.numFound}
        searchText={text ?? ""}
        orderby={orderby || "score"}
        initialLimit={searchResult.limit}
        facets={searchResult.facets}
      />
    </>
  );
}
