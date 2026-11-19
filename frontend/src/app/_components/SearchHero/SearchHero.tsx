"use client";

import { Heading, Search, Tag } from "@kv-designsystem/react";
import { LocationPinFillIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import { useState } from "react";
import { useDictionary, useLocale } from "@/components/I18nProvider";
import { basePath } from "@/lib/basePath";
import { localizedPath } from "@/lib/i18n";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./SearchHero.module.css";
import { useSearchAutocomplete } from "./useSearchAutocomplete";

export function SearchHero({ initialValue = "" }: { initialValue?: string }) {
  const [searchText, setSearchText] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const { suggestions } = useSearchAutocomplete(searchText);
  const showSuggestions = isFocused && suggestions.length > 0;
  const locale = useLocale();
  const { searchHero: t, productTypes } = useDictionary();

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
          {t.heading}
        </Heading>
        <form
          action={`${basePath}${localizedPath(locale, "/")}`}
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
            {t.label}
          </label>
          <div className={styles.searchRow}>
            <div className={styles.searchInputWrapper}>
              <Search className={styles.searchField}>
                <Search.Input
                  id="hero-search"
                  name="text"
                  aria-label={t.label}
                  placeholder={t.placeholder}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  type="search"
                  autoComplete="off"
                />
                <Search.Clear
                  onClick={() => {
                    setSearchText("");
                    trackClick("clear-search", LOCATIONS.SearchHero);
                  }}
                />
              </Search>
              {showSuggestions ? (
                <ul className={styles.suggestions} aria-label={t.suggestions}>
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.uuid}>
                      <Link
                        href={localizedPath(
                          locale,
                          `/metadata/${suggestion.uuid}`,
                        )}
                      >
                        <span>{suggestion.title}</span>
                        <Tag className={styles.hierarchyTag}>
                          {" "}
                          {productTypes[
                            suggestion.hierarchyLevel as keyof typeof productTypes
                          ] ?? productTypes.default}{" "}
                        </Tag>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Search.Button className={styles.searchButton} variant="primary">
              {t.button}
            </Search.Button>
          </div>
        </form>
      </div>
    </section>
  );
}
