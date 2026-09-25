"use client";

import { useEffect, useState } from "react";
import { basePath } from "@/lib/basePath";
import { RESERVED_SEARCH_PARAMS } from "@/lib/facets";
import {
  parseSearchResult,
  SearchResult,
  SearchResultItem,
} from "@/lib/schemas/search";
import type { DatasetCardProps } from "../DatasetCard/DatasetCard";
import { getSearchResults } from "./../../api"; //Refactor to use this

type SearchResultCard = Omit<DatasetCardProps, "viewMode">;

type UsePaginatedSearchResultsOptions = {
  searchText: string;
  orderby: string;
  pageSize?: number;
  initialOffset?: number;
};

const PAGE_SIZE = 12;

export function usePaginatedSearchResults({
  searchText,
  orderby,
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
    const doSearch = async (params: URLSearchParams) => {
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

        setResults(nextPage.results != null ? nextPage.results : []);
        setTotal(nextPage.numFound);
        setFacets(nextPage.facets ?? []);
        setHasMoreResults((nextPage.results?.length ?? 0) + currentOffset < nextPage.numFound);
      } catch {
        setLoadMoreError("Kunne ikke hente flere treff akkurat nå.");
      } finally {
        setIsLoadingMore(false);
      }
    };
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(currentOffset),
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

    setIsLoadingMore(true);
    setLoadMoreError(null);
    doSearch(params);
  }, [searchText, orderby, pageSize, currentOffset]);

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
