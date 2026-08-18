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
        <a
          data-variant="secondary"
          target="_blank"
          rel="noopener noreferrer"
          href={coverageUrl}
          className={`ds-button ${styles.actionButton}`}
          data-color="neutral"
        >
          <ExternalLinkIcon aria-hidden />
          Vis dekningskart
        </a>
      )}
      <a
        data-variant="secondary"
        target="_blank"
        rel="noreferrer"
        href={getMetadataXmlUrl(uuid)}
        className={`ds-button ${styles.actionButton}`}
        data-color="neutral"
      >
        <FileTextIcon aria-hidden />
        Vis metadata XML
      </a>
      {/*TODO: GN-227 håndtere at noen datasett ikke burde redigeres fra denne editUrl-en*/}
      <a
        data-variant="secondary"
        target="_blank"
        rel="noreferrer"
        href={getEditUrl(uuid)}
        className={`ds-button ${styles.actionButton}`}
        data-color="neutral"
      >
        <PencilIcon aria-hidden />
        Rediger metadata
      </a>
    </div>
  );
}
