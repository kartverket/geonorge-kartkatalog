"use client";

import { Heading, Search, Tag } from "@kv-designsystem/react";
import { LocationPinFillIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isBeta } from "@/lib/basePath";
import { getProductTypeString } from "@/lib/productType";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./SearchHero.module.css";
import { useSearchAutocomplete } from "./useSearchAutocomplete";

export function SearchHero({ initialValue = "" }: { initialValue?: string }) {
  const [searchText, setSearchText] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const { suggestions } = useSearchAutocomplete(searchText);
  const showSuggestions = isFocused && suggestions.length > 0;
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        <Heading data-size="lg" level={1} className={styles.title}>
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
          <div className={styles.searchRow}>
            <div className={styles.searchInputWrapper}>
              <Search className={styles.searchField}>
                <Search.Input
                  ref={inputRef}
                  id="hero-search"
                  name="text"
                  aria-label="Søk i Kartkatalogen"
                  placeholder="Naturvernområder, FKB-Bygning..."
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  type="search"
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
                        <span>{suggestion.title}</span>
                        <Tag className={styles.hierarchyTag}>
                          {" "}
                          {getProductTypeString(suggestion.hierarchyLevel)}{" "}
                        </Tag>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Search.Button className={styles.searchButton} variant="primary" />
          </div>
        </form>
      </div>
    </section>
  );
}
