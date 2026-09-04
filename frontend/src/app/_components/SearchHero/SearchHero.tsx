"use client";

import { Heading, Search } from "@kv-designsystem/react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./SearchHero.module.css";

export function SearchHero({ initialValue = "" }: { initialValue?: string }) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <Heading data-size="lg" className={styles.title}>
          Finn data
        </Heading>
        <form action="/" method="get" className={styles.form}>
          <label htmlFor="hero-search" className={styles.label}>
            Søk i Kartkatalogen
          </label>
          <Search data-color="neutral">
            <Search.Input
              id="hero-search"
              name="text"
              aria-label="Søk i Kartkatalogen"
              placeholder="Naturvernområder, FKB-Bygning..."
              defaultValue={initialValue}
            />
            <Search.Clear
              onClick={() => trackClick("clear-search", LOCATIONS.SearchHero)}
            />
          </Search>
        </form>
      </div>
    </section>
  );
}
