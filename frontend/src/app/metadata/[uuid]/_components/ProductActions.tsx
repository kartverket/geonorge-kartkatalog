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
import styles from "./ProductActions.module.css";

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
