import {
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import {
  getEditUrl,
  getMetadataXmlUrl,
} from "@/app/metadata/[uuid]/_utils/urls";
import styles from "./ProductActions.module.css";

export async function ProductActions({
  coverageUrl,
  uuid,
}: {
  coverageUrl: string | null;
  uuid: string;
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
          href={coverageUrl}
          className="ds-button"
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
        className="ds-button"
        data-color="neutral"
      >
        <FileTextIcon aria-hidden />
        Last ned metadata XML
      </a>
      {/*TODO: GN-227 håndtere at noen datasett ikke burde redigeres fra denne editUrl-en*/}
      <a
        data-variant="secondary"
        target="_blank"
        rel="noreferrer"
        href={getEditUrl(uuid)}
        className="ds-button"
        data-color="neutral"
      >
        <PencilIcon aria-hidden />
        Rediger metadata
      </a>
    </div>
  );
}
