"use client";
import { Button } from "@kv-designsystem/react";
import { CheckmarkIcon, FilesIcon } from "@navikt/aksel-icons";
import { useCopyUrl } from "@/app/metadata/[uuid]/_utils/hooks";
import styles from "./CopyButton.module.css";

export function CopyButton({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const { copied, copy } = useCopyUrl(url);
  return (
    <Button variant="secondary" className={className} onClick={copy}>
      <span className={styles.swap}>
        <span className={`${styles.state} ${copied ? styles.stateHidden : ""}`}>
          <FilesIcon aria-hidden /> Kopier lenke
        </span>
        <span className={`${styles.state} ${copied ? "" : styles.stateHidden}`}>
          <CheckmarkIcon aria-hidden /> Kopiert
        </span>
      </span>
    </Button>
  );
}
