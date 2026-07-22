"use client";

import { Button } from "@kv-designsystem/react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import styles from "./DatasetActions.module.css";

export function DatasetActions({
  downloadUrl,
  coverageUrl,
  metadataXmlUrl,
  editUrl,
}: {
  downloadUrl?: string;
  coverageUrl?: string;
  metadataXmlUrl?: string;
  editUrl?: string;
}) {
  return (
    <div className={styles.actions}>
      <Button variant="primary" data-color="neutral">
        <DownloadIcon aria-hidden />
        Legg i nedlastingskurv
      </Button>
      {coverageUrl && (
        <Button variant="secondary" data-color="neutral">
          <ExternalLinkIcon aria-hidden />
          Vis dekningskart
        </Button>
      )}
      {metadataXmlUrl && (
        <Button variant="secondary" data-color="neutral">
          <FileTextIcon aria-hidden />
          Last ned metadata XML
        </Button>
      )}
      {editUrl && (
        <Button variant="secondary" data-color="neutral">
          <PencilIcon aria-hidden />
          Rediger metadata
        </Button>
      )}
    </div>
  );
}
