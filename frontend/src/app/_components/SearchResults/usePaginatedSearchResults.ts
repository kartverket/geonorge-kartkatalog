"use client";

import { useEffect, useState } from "react";
import { basePath } from "@/lib/basePath";
import { RESERVED_SEARCH_PARAMS } from "@/lib/facets";
import { parseSearchResult } from "@/lib/schemas/search";
import type { DatasetCardProps } from "../DatasetCard/DatasetCard";

type SearchResultCard = Omit<DatasetCardProps, "viewMode">;

type UsePaginatedSearchResultsOptions = {
  initialResults: SearchResultCard[];
  totalCount: number;
  searchText: string;
  orderby: string;
  initialLimit: number;
  initialOffset: number;
};

const PAGE_SIZE = 25;

export function usePaginatedSearchResults({
  initialResults,
  totalCount,
  searchText,
  orderby,
  initialLimit,
  initialOffset,
}: UsePaginatedSearchResultsOptions) {
  const [results, setResults] = useState(initialResults);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(
    initialResults.length >= totalCount,
  );

  useEffect(() => {
    setResults(initialResults);
    setIsLoadingMore(false);
    setLoadMoreError(null);
    setHasReachedEnd(initialResults.length >= totalCount);
  }, [initialResults, totalCount]);

  const hasMoreResults = !hasReachedEnd && results.length < totalCount;

  async function handleLoadMore() {
    if (isLoadingMore || !hasMoreResults) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError(null);

    const params = new URLSearchParams({
      limit: String(initialLimit || PAGE_SIZE),
      offset: String(initialOffset + results.length),
      orderby,
    });
    const trimmedSearchText = searchText.trim();

    if (trimmedSearchText) {
      params.set("text", trimmedSearchText);
    }

    for (const [key, value] of new URLSearchParams(window.location.search)) {
      if (!RESERVED_SEARCH_PARAMS.has(key)) {
        params.append(key, value);
      }
    }

    try {
      const response = await fetch(
        `${basePath}/api/search?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        setLoadMoreError("Kunne ikke hente flere treff akkurat nå.");
        return;
      }

      const body: unknown = await response.json();
      const nextPage = parseSearchResult(body);
      const lastVisibleResultIndex =
        nextPage.offset + nextPage.results.length - 1;

      setResults((currentResults) => [...currentResults, ...nextPage.results]);
      setHasReachedEnd(
        nextPage.results.length === 0 ||
          lastVisibleResultIndex >= nextPage.numFound,
      );
    } catch {
      setLoadMoreError("Kunne ikke hente flere treff akkurat nå.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  return {
    results,
    isLoadingMore,
    loadMoreError,
    hasMoreResults,
    handleLoadMore,
  };
}
