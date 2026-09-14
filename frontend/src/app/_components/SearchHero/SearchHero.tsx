"use client";

import { Heading, Search } from "@kv-designsystem/react";
import { DiamondIcon, LocationPinFillIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { basePath, isBeta } from "@/lib/basePath";
import { parseSearchResult, type SearchResult } from "@/lib/schemas/search";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./SearchHero.module.css";

const MINIMUM_SEARCH_LENGTH = 2;
const SEARCH_DELAY_MS = 300;
const SUGGESTION_LIMIT = 9;

type Suggestion = Pick<SearchResult["results"][number], "title" | "uuid">;

export function SearchHero({ initialValue = "" }: { initialValue?: string }) {
  const [searchText, setSearchText] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);

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

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <section className={styles.hero}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.backgroundInner}>
          <LocationPinFillIcon
            className={`${styles.pin} ${styles.leftPin}`}
            aria-hidden
          />
          <LocationPinFillIcon
            className={`${styles.pin} ${styles.rightPin}`}
            aria-hidden
          />
        </div>
      </div>
      <div className={styles.inner}>
        <Heading data-size="lg" className={styles.title}>
          Finn data
        </Heading>
        <form
          action={isBeta ? "/beta" : "/"}
          method="get"
          className={styles.form}
          onFocusCapture={() => setIsFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsFocused(false);
            }
          }}
        >
          <label htmlFor="hero-search" className={styles.label}>
            Søk i Kartkatalogen
          </label>
          <Search className={styles.searchField}>
            <Search.Input
              id="hero-search"
              name="text"
              aria-label="Søk i Kartkatalogen"
              placeholder="Naturvernområder, FKB-Bygning..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <Search.Clear
              onClick={() => {
                setSearchText("");
                trackClick("clear-search", LOCATIONS.SearchHero);
              }}
            />
          </Search>
          {showSuggestions ? (
            <ul className={styles.suggestions} aria-label="Søkeforslag">
              {suggestions.map((suggestion) => (
                <li key={suggestion.uuid}>
                  <Link href={`/metadata/${suggestion.uuid}`}>
                    <DiamondIcon aria-hidden />
                    <span>{suggestion.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      </div>
    </section>
  );
}
