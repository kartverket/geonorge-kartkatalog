"use client";

import { useEffect, useState } from "react";
import type { SearchResult, SearchResultItem } from "@/lib/schemas/search";
import { getSearchResults } from "./../../api";

type UsePaginatedSearchResultsOptions = {
  searchText: string;
  filters: Record<string, string[]>;
  orderby: string;
  pageSize?: number;
  initialOffset?: number;
};

const PAGE_SIZE = 12;

export function usePaginatedSearchResults({
  searchText,
  orderby,
  filters,
  pageSize = PAGE_SIZE,
  initialOffset = 0,
}: UsePaginatedSearchResultsOptions) {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [currentOffset, setCurrentOffset] = useState(initialOffset || 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [facets, setFacets] = useState<SearchResult["facets"]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const doSearch = async (
      text: string,
      orderby: string,
      filters: Record<string, string[]>,
      limit: number,
      offset: number,
    ) => {
      try {
        const response = await getSearchResults({
          text,
          orderby,
          filters,
          limit,
          offset,
        });

        setResults(response.results != null ? response.results : []);
        setTotal(response.numFound);
        setFacets(response.facets ?? []);
        setHasMoreResults(
          (response.results?.length ?? 0) + currentOffset < response.numFound,
        );
      } catch {
        setLoadMoreError("Kunne ikke hente flere treff akkurat nå.");
      } finally {
        setIsLoadingMore(false);
      }
    };

    setIsLoadingMore(true);
    setLoadMoreError(null);
    doSearch(searchText, orderby, filters, pageSize, currentOffset);
  }, [searchText, orderby, pageSize, filters, currentOffset]);

  const nextPage = () => {
    if (currentOffset + pageSize >= total) {
      return;
    }
    setCurrentOffset(currentOffset + pageSize);
  };

  const prevPage = () => {
    if (currentOffset - pageSize < 0) {
      return;
    }
    setCurrentOffset(currentOffset - pageSize);
  };

  return {
    results,
    facets,
    total,
    isLoadingMore,
    loadMoreError,
    currentOffset,
    hasMoreResults,
    nextPage, //rework the paging mechanism
    prevPage,
  };
}
