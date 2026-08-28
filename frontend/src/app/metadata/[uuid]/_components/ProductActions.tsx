import {
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import AddSeriesToCartButton from "@/app/_components/addToCart/AddSeriesToCartButton";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import type { DownloadItem } from "@/app/_components/addToCart/cartStorage";
import {
  getEditUrl,
  getMetadataXmlUrl,
} from "@/app/metadata/[uuid]/_utils/urls";
import type {
  DistributionGroup,
  LinkedDistribution,
  LinkedDistributions,
  ProductMetadata,
} from "@/lib/schemas/product";
import { LOCATIONS } from "@/posthog/posthog";
import styles from "./ProductActions.module.css";
import { TrackedActionLinkButton } from "./TrackedActionLinkButton";

function getGeonorgeDownloadUrl(
  distributionGroups: DistributionGroup[],
): string | null {
  const group = distributionGroups.find(
    (g) => g.protocol === "GEONORGE:DOWNLOAD",
  );
  const rawUrl = group?.formats[0]?.urls[0];
  if (!rawUrl) return null;
  const stripped = rawUrl.replace(/\/+$/, "");
  const lastSlash = stripped.lastIndexOf("/");
  return lastSlash !== -1 ? stripped.substring(0, lastSlash + 1) : stripped;
}

function toDownloadItem(d: LinkedDistribution): DownloadItem | null {
  if (d.distributionProtocol !== "GEONORGE:DOWNLOAD" || !d.distributionUrl) {
    return null;
  }

  return {
    uuid: d.uuid,
    name: d.title ?? "-",
    distributionUrl: d.distributionUrl,
  };
}

export function ProductActions({
  linkedDistributions,
  metadata,
  uuid,
}: {
  linkedDistributions: LinkedDistributions;
  metadata: ProductMetadata;
  uuid: string;
}) {
  const cartItem =
    metadata.hierarchyLevel === "dataset" && metadata.accessState === "open"
      ? {
          uuid,
          name: metadata.title,
          distributionUrl: getGeonorgeDownloadUrl(metadata.distributionGroups),
        }
      : null;
  const downloadableSeriesMembers = linkedDistributions.seriesMembers.flatMap(
    (distribution) => {
      const downloadItem = toDownloadItem(distribution);
      return downloadItem ? [downloadItem] : [];
    },
  );

  return (
    <div className={styles.actions}>
      <AddSeriesToCartButton
        className={`ds-button ${styles.actionButton}`}
        items={downloadableSeriesMembers}
        location={LOCATIONS.MetadataPage}
        variant="secondary"
      />
      <AddToCartButton
        className={`ds-button ${styles.actionButton}`}
        item={cartItem}
        location={LOCATIONS.MetadataPage}
      />
      {metadata.coverageUrl && (
        <TrackedActionLinkButton
          eventName="show-coverage-map"
          href={metadata.coverageUrl}
          icon={<ExternalLinkIcon aria-hidden />}
          title="Vis dekningskart"
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
