import {
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import AddSeriesToCartButton from "@/app/_components/addToCart/AddSeriesToCartButton";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import type { DownloadItem } from "@/app/_components/addToCart/cartStorage";
import AddToMapButton from "@/app/_components/addToMap/AddToMapButton";
import type { MapItem } from "@/app/_components/addToMap/mapStorage";
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
import styles from "./ProductActions.module.css";

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

function getCapabilitiesUrl(
  distributionGroups: DistributionGroup[],
): string | null {
  const group = distributionGroups.find((g) => g.protocol === "OGC:WMS");
  const rawUrl = group?.formats[0]?.urls[0];
  return rawUrl ?? null;
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

  // TODO: utvide med at den har relatert karttjeneste
  const hasMapService = getCapabilitiesUrl(metadata.distributionGroups);

  const mapItem: MapItem | null =
    metadata.accessState === "open" && hasMapService
      ? {
          addLayers: [],
          DistributionProtocol: "OGC:WMS",
          Uuid: uuid,
          Title: metadata.title,
          GetCapabilitiesUrl: hasMapService,
        }
      : null;

  return (
    <div className={styles.actions}>
      <AddSeriesToCartButton
        className={`ds-button ${styles.actionButton}`}
        items={downloadableSeriesMembers}
        variant="secondary"
      />
      <AddToCartButton
        className={`ds-button ${styles.actionButton}`}
        item={cartItem}
      />
      <AddToMapButton
        className={`ds-button ${styles.actionButton}`}
        item={mapItem}
      />
      {metadata.coverageUrl && (
        <ActionLinkButton
          href={metadata.coverageUrl}
          icon={<ExternalLinkIcon aria-hidden />}
          title="Vis dekningskart"
        />
      )}
      <ActionLinkButton
        href={getMetadataXmlUrl(uuid)}
        icon={<FileTextIcon aria-hidden />}
        title="Vis metadata XML"
      />
      {/*TODO: GN-227 håndtere at noen datasett ikke burde redigeres fra denne editUrl-en*/}
      <ActionLinkButton
        title="Rediger metadata"
        href={getEditUrl(uuid)}
        icon={<PencilIcon aria-hidden />}
      />
    </div>
  );
}

function ActionLinkButton({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <a
      data-variant="secondary"
      data-color="neutral"
      target="_blank"
      rel="noreferrer"
      href={href}
      className={`ds-button ${styles.actionButton}`}
    >
      {icon}
      {title}
    </a>
  );
}
