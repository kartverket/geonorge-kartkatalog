import {
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import AddSeriesToDownloadsButton from "@/app/_components/addToDownloads/AddSeriesToDownloadsButton";
import AddToDownloadsButton from "@/app/_components/addToDownloads/AddToDownloadsButton";
import AddToMapButton from "@/app/_components/addToMap/AddToMapButton";
import {
  getDownloadableSeriesMembers,
  getDownloadItem,
  getMapItem,
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
import styles from "./ProductActions.module.css";
import { TrackedActionLinkButton } from "./TrackedActionLinkButton";

export function ProductActions({
  linkedDistributions,
  metadata,
  uuid,
}: {
  linkedDistributions: LinkedDistributions;
  metadata: ProductMetadata;
  uuid: string;
}) {
  const downloadItem = getDownloadItem(metadata, uuid);
  const downloadableSeriesMembers =
    getDownloadableSeriesMembers(linkedDistributions);
  const mapItem = getMapItem(metadata, linkedDistributions, uuid);

  return (
    <div className={styles.actions}>
      <AddSeriesToDownloadsButton
        item={{
          uuid,
          title: metadata.title,
        }}
        className={styles.actionButton}
        downloadableItems={downloadableSeriesMembers}
        location={LOCATIONS.MetadataPage}
      />
      <AddToDownloadsButton
        className={styles.actionButton}
        item={downloadItem}
        location={LOCATIONS.MetadataPage}
      />
      <AddToMapButton
        variant="primary"
        className={styles.actionButton}
        item={mapItem}
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
