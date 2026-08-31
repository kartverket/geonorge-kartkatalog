import {
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import AddSeriesToCartButton from "@/app/_components/addToCart/AddSeriesToCartButton";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import AddToMapButton from "@/app/_components/addToMap/AddToMapButton";
import {
  getCartItem,
  getDownloadableSeriesMembers,
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
  const cartItem = getCartItem(metadata, uuid);
  const downloadableSeriesMembers =
    getDownloadableSeriesMembers(linkedDistributions);
  const mapItem = getMapItem(metadata, linkedDistributions, uuid);

  return (
    <div className={styles.actions}>
      <AddSeriesToCartButton
        item={{ ...metadata, uuid }}
        className={`ds-button ${styles.actionButton}`}
        downloadableItems={downloadableSeriesMembers}
        location={LOCATIONS.MetadataPage}
        variant="secondary"
      />
      <AddToCartButton
        className={`ds-button ${styles.actionButton}`}
        item={cartItem}
        location={LOCATIONS.MetadataPage}
      />
      <AddToMapButton
        className={`ds-button ${styles.actionButton}`}
        item={mapItem}
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
