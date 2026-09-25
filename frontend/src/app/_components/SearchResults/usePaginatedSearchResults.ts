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
  const [currentPage, setCurrentPage] = useState(
    Math.floor(initialOffset / pageSize) + 1,
  );

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
      page: number,
    ) => {
      try {
        const response = await getSearchResults({
          text,
          orderby,
          filters,
          limit,
          offset: (page - 1) * pageSize,
        });

        setResults(response.results != null ? response.results : []);
        setTotal(response.numFound);
        setFacets(response.facets ?? []);
        setHasMoreResults(
          (response.results?.length ?? 0) + (page - 1) * pageSize <
            response.numFound,
        );
      } catch {
        setLoadMoreError("Kunne ikke hente flere treff akkurat nå.");
      } finally {
        setIsLoadingMore(false);
      }
    };

    setIsLoadingMore(true);
    setLoadMoreError(null);
    doSearch(searchText, orderby, filters, pageSize, currentPage);
  }, [searchText, orderby, pageSize, filters, currentPage]);

  const setPage = (page: number) => {
    if (page < 1) {
      page = 1;
    }
    if (page > Math.ceil(total / pageSize)) {
      page = Math.ceil(total / pageSize);
    }
    setCurrentPage(page);
  };

  return {
    results,
    facets,
    total,
    totalPageCount: Math.ceil(total / pageSize),
    isLoadingMore,
    loadMoreError,
    currentPage,
    hasMoreResults,
    setCurrentPage: setPage,
  };
}
