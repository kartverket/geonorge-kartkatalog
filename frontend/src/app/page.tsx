import type { DatasetCardProps } from "./_components/DatasetCard/DatasetCard";
import { SearchHero } from "./_components/SearchHero/SearchHero";
import { SearchResults } from "./_components/SearchResults/SearchResults";
import { getSearchResults } from "./api";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    text?: string;
    orderby?: string;
  }>;
}) {
  const { text, orderby } = await searchParams;
  const searchResult = await getSearchResults({
    text,
    offset: 1,
    limit: 25,
    orderby: orderby || "score",
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
      />
    </>
  );
}
