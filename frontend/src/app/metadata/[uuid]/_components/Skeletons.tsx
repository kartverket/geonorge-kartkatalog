"use client";

import { Skeleton } from "@kv-designsystem/react";
import productActionsStyles from "./ProductActions.module.css";
import styles from "./Skeletons.module.css";

export function ProductActionSkeleton() {
  return <Skeleton aria-hidden className={productActionsStyles.actionButton} />;
}

export function DistributionTabSkeleton() {
  return (
    <div aria-hidden className={styles.stack}>
      <Skeleton className={styles.heading}>Laster tilganger</Skeleton>
      <Skeleton className={styles.row} />
      <Skeleton className={styles.row} />
      <Skeleton className={styles.heading}>Laster tilknyttede</Skeleton>
      <Skeleton className={styles.row} />
      <Skeleton className={styles.row} />
      <Skeleton className={styles.row} />
    </div>
  );
}

export function ProductTabsSkeleton() {
  return (
    <div aria-hidden className={styles.stack}>
      <div className={styles.tabRow}>
        <Skeleton className={styles.tab}>Laster fane</Skeleton>
        <Skeleton className={styles.tab}>Laster fane</Skeleton>
        <Skeleton className={styles.tab}>Laster fane</Skeleton>
      </div>
      <DistributionTabSkeleton />
    </div>
  );
}
