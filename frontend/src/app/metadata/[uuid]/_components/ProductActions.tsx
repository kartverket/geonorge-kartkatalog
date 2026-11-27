import {
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import { Suspense } from "react";
import AddToDownloadsButton from "@/app/_components/addToDownloads/AddToDownloadsButton";
import type { DownloadItem } from "@/app/_components/addToDownloads/downloadStorage";
import AddToMapButton from "@/app/_components/addToMap/AddToMapButton";
import {
  getDownloadableSeriesMembers,
  getDownloadItem,
  getGeonorgeFileDownloadUrl,
  getMapItem,
  getThematicParentSeriesDownloadItem,
} from "@/app/metadata/[uuid]/_utils/distributions";
import {
  getEditUrl,
  getMetadataXmlUrl,
} from "@/app/metadata/[uuid]/_utils/urls";
import type {
  LinkedDistributions,
  ProductMetadata,
} from "@/lib/schemas/product";
import { LOCATIONS } from "@/posthog/posthog";
import { shouldShowCoverageMap } from "../dekningskart/utils";
import { MapLinkButton } from "./MapLinkButton";
import styles from "./ProductActions.module.css";
import { ProductActionSkeleton } from "./Skeletons";
import { TrackedActionLinkButton } from "./TrackedActionLinkButton";

export function ProductActions({
  linkedDistributions,
  metadata,
  uuid,
}: {
  linkedDistributions: Promise<LinkedDistributions>;
  metadata: ProductMetadata;
  uuid: string;
}) {
  const fileDownloadUrl = getGeonorgeFileDownloadUrl(
    metadata.distributionGroups,
  );

  return (
    <div className={styles.actions}>
      <Suspense fallback={<ProductActionSkeleton />}>
        <LinkedDistributionActions
          linkedDistributions={linkedDistributions}
          metadata={metadata}
          uuid={uuid}
        />
      </Suspense>
      <MapLinkButton
        shouldShowCoverageMap={shouldShowCoverageMap(metadata)}
        uuid={uuid}
      />
      {fileDownloadUrl && (
        <TrackedActionLinkButton
          eventName="download-file-distribution-from-product-actions"
          href={fileDownloadUrl}
          icon={<DownloadIcon aria-hidden />}
          title="Last ned"
          variant="primary"
        />
      )}
      {metadata.productPageUrl && (
        <TrackedActionLinkButton
          eventName="show-product-page"
          href={metadata.productPageUrl}
          icon={<ExternalLinkIcon aria-hidden />}
          title="Vis produktside"
        />
      )}
      <TrackedActionLinkButton
        eventName="show-metadata-xml"
        href={getMetadataXmlUrl(uuid)}
        icon={<FileTextIcon aria-hidden />}
        title="Vis metadata XML"
      />
      {/*TODO: GN-227 håndtere at noen datasett ikke burde redigeres fra denne editUrl-en*/}
      <TrackedActionLinkButton
        eventName="edit-metadata"
        title="Rediger metadata"
        href={getEditUrl(uuid)}
        icon={<PencilIcon aria-hidden />}
      />
    </div>
  );
}

async function LinkedDistributionActions({
  linkedDistributions: linkedDistributionsPromise,
  metadata,
  uuid,
}: {
  linkedDistributions: Promise<LinkedDistributions>;
  metadata: ProductMetadata;
  uuid: string;
}) {
  const linkedDistributions = await linkedDistributionsPromise;
  const downloadItem = getDownloadItem(metadata, uuid);
  const thematicSeriesDownloadItem =
    getThematicParentSeriesDownloadItem(linkedDistributions);
  const isThematicSeries =
    metadata.hierarchyLevel === "series" &&
    metadata.seriesType === "series_thematic";
  const downloadableSeriesMembers = isThematicSeries
    ? []
    : getDownloadableSeriesMembers(linkedDistributions);
  const mapItem = getMapItem(metadata, linkedDistributions, uuid);

  return (
    <>
      <AddToDownloadsButton
        trackingItem={{ uuid, name: metadata.title }}
        className={styles.actionButton}
        items={downloadableSeriesMembers}
        location={LOCATIONS.MetadataPage}
      />
      <AddToDownloadsButton
        className={styles.actionButton}
        items={[thematicSeriesDownloadItem ?? downloadItem].filter(
          (i): i is DownloadItem => i !== null,
        )}
        location={LOCATIONS.MetadataPage}
      />
      <AddToMapButton
        variant="primary"
        className={styles.actionButton}
        item={mapItem}
        location={LOCATIONS.MetadataPage}
      />
    </>
  );
}
