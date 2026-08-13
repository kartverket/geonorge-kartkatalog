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

type Category = "application" | "view-service" | "download-service";

function toDatasetCardProps(d: LinkedDistribution, category: Category) {
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

function DistributionGroup({
  heading,
  items,
  category,
}: {
  heading: string;
  items: LinkedDistribution[];
  category: Category;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (items.length === 0) return null;

  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const canCollapse = !hasMore && items.length > PAGE_SIZE;

  return (
    <div className={styles.group}>
      <Heading data-size="2xs" className={styles.subHeading}>
        {heading}
      </Heading>
      <div className={styles.cardGrid}>
        {visible.map((d) => (
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

export function LinkedDistributionsSection({
  linkedDistributions,
}: {
  linkedDistributions: LinkedDistributions;
}) {
  const applications = linkedDistributions?.applications ?? [];
  const viewServices = linkedDistributions?.viewServices ?? [];
  const downloadServices = linkedDistributions?.downloadServices ?? [];

  if (
    applications.length === 0 &&
    viewServices.length === 0 &&
    downloadServices.length === 0
  ) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Heading data-size="xs" className={styles.heading}>
        Koblede distribusjoner
      </Heading>
      <DistributionGroup
        heading="Applikasjoner"
        items={applications}
        category="application"
      />
      <DistributionGroup
        heading="Visningstjenester"
        items={viewServices}
        category="view-service"
      />
      <DistributionGroup
        heading="Nedlastingstjenester"
        items={downloadServices}
        category="download-service"
      />
    </div>
  );
}
