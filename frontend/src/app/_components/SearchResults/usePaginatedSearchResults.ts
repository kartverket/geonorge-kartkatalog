"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

  const doSearch = useCallback(
    async (
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
          offset: (page - 1) * limit,
        });

        setResults(response.results != null ? response.results : []);
        setTotal(response.numFound);
        setFacets(response.facets ?? []);
        setHasMoreResults(
          (response.results?.length ?? 0) + (page - 1) * limit <
            response.numFound,
        );
      } catch {
        setLoadMoreError("Kunne ikke hente flere treff akkurat nå.");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setCurrentPage(1);
    const effect = async () => {
      await doSearch(searchText, orderby, filters, pageSize, 1);
    };
    effect();
  }, [doSearch, pageSize, searchText, orderby, filters]);

  useEffect(() => {
    console.log("Effct secnod")
    const effect = async () => {
      setIsLoadingMore(true);
      setLoadMoreError(null);
      await doSearch(searchText, orderby, filters, pageSize, currentPage);
    };
    effect();
  }, [doSearch, currentPage, pageSize, searchText, orderby, filters]);

  const setPage = (page: number) => {
    let pageToSet = page
    if (page < 1) {
      pageToSet = 1;
    }
    if (page > Math.ceil(total / pageSize)) {
      pageToSet = Math.ceil(total / pageSize);
    }
    setCurrentPage(pageToSet);
  }; //Bruk tanstack query. JEg orker ikke mer

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
