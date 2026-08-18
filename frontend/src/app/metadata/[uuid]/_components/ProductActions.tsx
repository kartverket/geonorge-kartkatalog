import {
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import AddToCartButton from "@/app/_components/AddToCartButton";
import {
  getEditUrl,
  getMetadataXmlUrl,
} from "@/app/metadata/[uuid]/_utils/urls";
import type { ProductMetadata } from "@/lib/schemas/product";
import styles from "./ProductActions.module.css";

export async function ProductActions({
  metadata,
  coverageUrl,
  uuid,
}: {
  metadata: ProductMetadata;
  coverageUrl: string | null;
  uuid: string;
}) {
  const geonorgeDownloadUrl = (() => {
    const group = metadata.distributionGroups.find(
      (g) => g.protocol === "GEONORGE:DOWNLOAD",
    );
    const rawUrl = group?.formats[0]?.urls[0];
    if (!rawUrl) return null;
    const stripped = rawUrl.replace(/\/+$/, "");
    const lastSlash = stripped.lastIndexOf("/");
    return lastSlash !== -1 ? stripped.substring(0, lastSlash + 1) : rawUrl;
  })();

  const showCartButton =
    metadata.hierarchyLevel === "dataset" && geonorgeDownloadUrl !== null;

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
