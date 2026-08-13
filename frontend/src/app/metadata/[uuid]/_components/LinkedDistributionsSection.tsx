"use client";

import { Button, Heading } from "@kv-designsystem/react";
import { useState } from "react";
import { DatasetCard } from "@/app/_components/DatasetCard/DatasetCard";
import { getProductTypeString } from "@/lib/productType";
import type {
  LinkedDistribution,
  LinkedDistributions,
} from "@/lib/schemas/product";
import styles from "./LinkedDistributionsSection.module.css";

const PAGE_SIZE = 4;

function toDatasetCardProps(
  d: LinkedDistribution,
  category: "application" | "view-service" | "download-service",
) {
  return {
    uuid: d.uuid,
    title: d.title ?? "-",
    organization: d.organization ?? undefined,
    typeTranslated: getProductTypeString(d.hierarchyLevel) ?? undefined,
    thumbnailUrl: d.thumbnailUrl ?? undefined,
    distributionUrl: d.distributionUrl ?? undefined,
    distributionProtocol: d.distributionProtocol ?? undefined,
    getCapabilitiesUrl: d.getCapabilitiesUrl ?? undefined,
    showMapLink: d.showMapLink,
    mapCapabilitiesUrl: d.mapCapabilitiesUrl ?? undefined,
    protocolName: d.protocolName ?? undefined,
    formats: d.formats,
    showThumbnail: false,
    category,
  };
}

export function LinkedDistributionsSection({
  linkedDistributions,
}: {
  linkedDistributions: LinkedDistributions;
}) {
  const all = [
    ...(linkedDistributions?.applications ?? []).map((d) => ({
      d,
      category: "application" as const,
    })),
    ...(linkedDistributions?.viewServices ?? []).map((d) => ({
      d,
      category: "view-service" as const,
    })),
    ...(linkedDistributions?.downloadServices ?? []).map((d) => ({
      d,
      category: "download-service" as const,
    })),
  ];

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  if (all.length === 0) return null;

  const visible = all.slice(0, visibleCount);
  const hasMore = visibleCount < all.length;
  const canCollapse = !hasMore && all.length > PAGE_SIZE;

  return (
    <div className={styles.wrapper}>
      <Heading data-size="xs" className={styles.heading}>
        Koblede distribusjoner
      </Heading>
      <div className={styles.cardGrid}>
        {visible.map(({d, category} ) => (
          <DatasetCard key={d.uuid} {...toDatasetCardProps(d, category)} />
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
