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

function toDatasetCardProps(d: LinkedDistribution) {
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
    protocolNames: d.protocolNames,
    formats: d.formats,
    showThumbnail: false,
    accessState: d.accessState,
    hierarchyLevel: d.hierarchyLevel,
  };
}

function joinDistributions(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} og ${items[items.length - 1]}`;
}

function getLinkedDistributionsHeading({
  hasDatasets,
  hasServices,
  hasServiceLayers,
  hasApplications,
}: {
  hasDatasets: boolean;
  hasServices: boolean;
  hasServiceLayers: boolean;
  hasApplications: boolean;
}) {
  const categories: string[] = [];
  if (hasDatasets) categories.push("datasett");
  if (hasServices) categories.push("tjenester");
  if (hasServiceLayers) categories.push("tjenestelag");
  if (hasApplications) categories.push("applikasjoner");

  return `Tilknyttede ${joinDistributions(categories)}`;
}

function DistributionGroup({
  heading,
  items,
}: {
  heading: string;
  items: LinkedDistribution[];
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

export function LinkedDistributionsSection({
  linkedDistributions,
}: {
  linkedDistributions: LinkedDistributions;
}) {
  const applications = linkedDistributions?.applications ?? [];
  const viewServices = linkedDistributions?.viewServices ?? [];
  const downloadServices = linkedDistributions?.downloadServices ?? [];
  const seriesMembers = linkedDistributions?.seriesMembers ?? [];
  const parentSeries = linkedDistributions?.parentSeries ?? [];
  const relatedDatasets = linkedDistributions?.relatedDatasets ?? [];
  const serviceLayers = linkedDistributions?.serviceLayers ?? [];
  const parentService = linkedDistributions?.parentService ?? [];

  const hasDatasets =
    seriesMembers.length > 0 ||
    parentSeries.length > 0 ||
    relatedDatasets.length > 0;

  const hasServices = viewServices.length > 0 || downloadServices.length > 0;

  const hasServiceLayers = serviceLayers.length > 0 || parentService.length > 0;

  const hasApplications = applications.length > 0;

  const heading = getLinkedDistributionsHeading({
    hasDatasets,
    hasServices,
    hasServiceLayers,
    hasApplications,
  });

  if (
    applications.length === 0 &&
    viewServices.length === 0 &&
    downloadServices.length === 0 &&
    seriesMembers.length === 0 &&
    parentSeries.length === 0 &&
    relatedDatasets.length === 0 &&
    serviceLayers.length === 0 &&
    parentService.length === 0
  ) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Heading data-size="xs" className={styles.heading}>
        {heading}
      </Heading>
      <DistributionGroup heading="Datasett i serien" items={seriesMembers} />
      <DistributionGroup heading="Datasettserier" items={parentSeries} />
      <DistributionGroup heading="Datasett" items={relatedDatasets} />
      <DistributionGroup heading="Applikasjoner" items={applications} />
      <DistributionGroup heading="Visningstjenester" items={viewServices} />
      <DistributionGroup
        heading="Nedlastingstjenester"
        items={downloadServices}
      />
      <DistributionGroup heading="Tjenestelag" items={serviceLayers} />
      <DistributionGroup heading="Tjeneste" items={parentService} />
    </div>
  );
}
