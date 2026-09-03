import { SearchHero } from "./_components/SearchHero/SearchHero";
import type { DatasetCardProps } from "./_components/DatasetCard/DatasetCard";
import { SearchResults } from "./_components/SearchResults/SearchResults";
import { getSearchResults } from "./api";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    text?: string;
    offset?: string;
    limit?: string;
    orderby?: string;
  }>;
}) {
  const { text, offset, limit, orderby } = await searchParams;
  const searchResult = await getSearchResults({
    text,
    offset: Number(offset) || 1,
    limit: Number(limit) || 25,
    orderby: orderby || "score",
  });
  const results: Array<Omit<DatasetCardProps, "viewMode">> = searchResult.results;

  return (
    <>
      <SearchHero initialValue={text ?? ""} />
      <SearchResults results={results} numFound={searchResult.numFound} />
    </>
  );
}
