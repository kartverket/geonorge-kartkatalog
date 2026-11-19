"use client";

import { Skeleton } from "@kv-designsystem/react";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <output className={styles.container} aria-label="Laster dekningskart">
      <div aria-hidden="true">
        <Skeleton className={styles.map} />
        <div className={styles.overlay}>
          <Skeleton className={styles.breadcrumb} />
          <div className={styles.card}>
            <Skeleton className={styles.title} />
            <Skeleton className={styles.heading} />
            <Skeleton className={styles.checkbox} />
            <Skeleton className={styles.checkbox} />
            <Skeleton className={styles.heading} />
            <Skeleton className={styles.checkbox} />
            <Skeleton className={styles.checkbox} />
            <Skeleton className={styles.checkbox} />
          </div>
          <div className={styles.card}>
            <Skeleton className={styles.heading} />
            <Skeleton className={styles.legend} />
            <Skeleton className={styles.legend} />
            <Skeleton className={styles.legend} />
          </div>
        </div>
      </div>
    </output>
  );
}
