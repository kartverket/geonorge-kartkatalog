import {
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import AddToCartButton from "@/app/_components/AddToCartButton";
import {
  getEditUrl,
  getGeonorgeDownloadUrl,
  getMetadataXmlUrl,
} from "@/app/metadata/[uuid]/_utils/urls";
import type { ProductMetadata } from "@/lib/schemas/product";
import styles from "./ProductActions.module.css";

export function ProductActions({
  metadata,
  coverageUrl,
  uuid,
}: {
  metadata: ProductMetadata;
  coverageUrl: string | null;
  uuid: string;
}) {
  const geonorgeDownloadUrl = getGeonorgeDownloadUrl(metadata);

  const showCartButton =
    metadata.hierarchyLevel === "dataset" &&
    metadata.accessState === "open" &&
    geonorgeDownloadUrl !== null;

  return (
    <div className={styles.actions}>
      {showCartButton && (
        <AddToCartButton
          className={`ds-button ${styles.actionButton}`}
          item={{
            uuid: uuid,
            name: metadata.title,
            distributionUrl: geonorgeDownloadUrl,
          }}
        />
      )}
      {coverageUrl && (
        <ActionLinkButton
          href={coverageUrl}
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
