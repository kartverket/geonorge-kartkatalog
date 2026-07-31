import {
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import styles from "./ProductActions.module.css";

export async function ProductActions({
  downloadUrl,
  coverageUrl,
  metadataXmlUrl,
  uuid,
}: {
  downloadUrl?: string;
  coverageUrl?: string;
  metadataXmlUrl?: string;
  uuid: string;
}) {
  const EDITOR_BASE_URL = process.env.EDITOR_BASE_URL;
  const editUrl = `${EDITOR_BASE_URL}/Metadata/Edit?uuid=${uuid}`;

  return (
    <div className={styles.actions}>
      <button
        className="ds-button"
        type="button"
        data-variant="primary"
        data-color="neutral"
      >
        <DownloadIcon aria-hidden />
        Legg i nedlastingskurv
      </button>
      {coverageUrl && (
        <button
          className="ds-button"
          type="button"
          data-variant="secondary"
          data-color="neutral"
        >
          <ExternalLinkIcon aria-hidden />
          Vis dekningskart
        </button>
      )}
      {metadataXmlUrl && (
        <button
          className="ds-button"
          type="button"
          data-variant="secondary"
          data-color="neutral"
        >
          <FileTextIcon aria-hidden />
          Last ned metadata XML
        </button>
      )}
      {/*TODO: GN-227 håndtere at noen datasett ikke burde redigeres fra denne editUrl-en*/}
      {editUrl && (
        <a
          data-variant="secondary"
          target="_blank"
          rel="noreferrer"
          href={editUrl}
          className="ds-button"
          data-color="neutral"
        >
          <PencilIcon aria-hidden />
          Rediger metadata
        </a>
      )}
    </div>
  );
}
