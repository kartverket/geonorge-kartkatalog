import { cookies } from "next/headers";
import type { DatasetCardProps } from "./_components/DatasetCard/DatasetCard";
import { SearchHero } from "./_components/SearchHero/SearchHero";
import { SearchResults } from "./_components/SearchResults/SearchResults";
import {
  isViewMode,
  VIEW_MODE_COOKIE_NAME,
} from "./_components/SearchResults/viewMode";
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
  const cookieStore = await cookies();
  const { text, offset, limit, orderby } = await searchParams;
  const storedViewMode = cookieStore.get(VIEW_MODE_COOKIE_NAME)?.value;
  const searchResult = await getSearchResults({
    text,
    offset: Number(offset) || 1,
    limit: Number(limit) || 25,
    orderby: orderby || "score",
  });
  const results: Array<Omit<DatasetCardProps, "viewMode">> =
    searchResult.results;

  return (
    <>
      <SearchHero initialValue={text ?? ""} />
      <SearchResults
        initialViewMode={isViewMode(storedViewMode) ? storedViewMode : "grid"}
        results={results}
      />
    </>
  );
}
