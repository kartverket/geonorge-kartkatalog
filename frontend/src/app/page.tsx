import { cookies } from "next/headers";
import { hasPerformanceConsentInCookieString } from "@/components/PosthogConsent/consentCookie";
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
    orderby?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const { text, orderby } = await searchParams;
  const storedViewMode = hasPerformanceConsentInCookieString(
    cookieStore.toString(),
  )
    ? cookieStore.get(VIEW_MODE_COOKIE_NAME)?.value
    : undefined;
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
        initialViewMode={isViewMode(storedViewMode) ? storedViewMode : "grid"}
        initialResults={results}
        totalCount={searchResult.numFound}
        searchText={text ?? ""}
        orderby={orderby || "score"}
        initialLimit={searchResult.limit}
      />
    </>
  );
}
