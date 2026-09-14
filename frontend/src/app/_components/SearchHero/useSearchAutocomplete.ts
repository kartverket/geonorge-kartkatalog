"use client";

import { useEffect, useState } from "react";
import { basePath } from "@/lib/basePath";
import { parseSearchResult, type SearchResult } from "@/lib/schemas/search";

const MINIMUM_SEARCH_LENGTH = 2;
const SEARCH_DELAY_MS = 300;
const SUGGESTION_LIMIT = 9;

export type SearchSuggestion = Pick<
  SearchResult["results"][number],
  "title" | "uuid"
>;

export function useSearchAutocomplete(searchText: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    const text = searchText.trim();
    if (text.length < MINIMUM_SEARCH_LENGTH) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    let isCurrentRequest = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          text,
          limit: String(SUGGESTION_LIMIT),
          offset: "1",
          orderby: "score",
        });
        const response = await fetch(`${basePath}/api/search?${params}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          if (isCurrentRequest) setSuggestions([]);
          return;
        }

        const body: unknown = await response.json();
        if (!isCurrentRequest) return;
        setSuggestions(
          parseSearchResult(body).results.slice(0, SUGGESTION_LIMIT),
        );
      } catch (error) {
        if (
          isCurrentRequest &&
          (error as { name?: string }).name !== "AbortError"
        ) {
          setSuggestions([]);
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      isCurrentRequest = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchText]);

  return { suggestions };
}
