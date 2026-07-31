import {
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import styles from "./ProductActions.module.css";

export function ProductActions({
  downloadUrl,
  coverageUrl,
  metadataXmlUrl,
  editUrl,
}: {
  downloadUrl?: string;
  coverageUrl: string | null;
  metadataXmlUrl?: string;
  editUrl?: string;
}) {
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
        <a
          data-variant="secondary"
          target="_blank"
          rel="noopener noreferrer"
          className="ds-button"
          data-color="neutral"
        >
          <ExternalLinkIcon aria-hidden />
          Vis dekningskart
        </a>
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
      {editUrl && (
        <button
          className="ds-button"
          type="button"
          data-variant="secondary"
          data-color="neutral"
        >
          <PencilIcon aria-hidden />
          Rediger metadata
        </button>
      )}
    </div>
  );
}
