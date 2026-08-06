"use client";

import { Button } from "@kv-designsystem/react";
import { useState } from "react";
import { DatasetCard } from "@/app/_components/DatasetCard/DatasetCard";
import type {
  LinkedDistribution,
  LinkedDistributions,
} from "@/lib/schemas/product";
import styles from "./LinkedDistributionsSection.module.css";

const PAGE_SIZE = 4;

function toDatasetCardProps(d: LinkedDistribution) {
  return {
    uuid: d.uuid,
    title: d.title ?? "-",
    organization: d.organization ?? undefined,
    typeTranslated: d.typeTranslated ?? undefined,
    thumbnailUrl: d.thumbnailUrl ?? undefined,
    distributionUrl: d.distributionUrl ?? undefined,
    distributionProtocol: d.distributionProtocol ?? undefined,
    getCapabilitiesUrl: d.getCapabilitiesUrl ?? undefined,
    showMapLink: d.showMapLink,
    mapCapabilitiesUrl: d.mapCapabilitiesUrl ?? undefined,
  };
}

export function LinkedDistributionsSection({
  linkedDistributions,
}: {
  linkedDistributions: LinkedDistributions;
}) {
  const all = [
    ...linkedDistributions.applications,
    ...linkedDistributions.viewServices,
    ...linkedDistributions.downloadServices,
  ];

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (all.length === 0) return null;

  const visible = all.slice(0, visibleCount);
  const hasMore = visibleCount < all.length;
  const canCollapse = !hasMore && all.length > PAGE_SIZE;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>Koblede distribusjoner</h3>
      <div className={styles.cardGrid}>
        {visible.map((d) => (
          <DatasetCard key={d.uuid} {...toDatasetCardProps(d)} />
        ))}
      </div>
      {hasMore && (
        <Button
          variant="tertiary"
          className={styles.loadMoreButton}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Last inn flere
        </Button>
      )}
      {canCollapse && (
        <Button
          variant="tertiary"
          className={styles.loadMoreButton}
          onClick={() => setVisibleCount(PAGE_SIZE)}
        >
          Skjul
        </Button>
      )}
    </div>
  );
}
