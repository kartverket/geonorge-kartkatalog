"use client";

import { Heading, Search } from "@kv-designsystem/react";
import styles from "./SearchHero.module.css";

export function SearchHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <Heading data-size="lg" className={styles.title}>
          Finn data
        </Heading>
        <form action="/" method="get" role="search" className={styles.form}>
          <label htmlFor="hero-search" className={styles.label}>
            Søk i Kartkatalogen
          </label>
          <Search data-color="neutral">
            <Search.Input
              id="hero-search"
              name="q"
              aria-label="Søk i Kartkatalogen"
              placeholder="Naturvernområder, FKB-Bygning..."
            />
            <Search.Clear />
          </Search>
        </form>
      </div>
    </section>
  );
}
