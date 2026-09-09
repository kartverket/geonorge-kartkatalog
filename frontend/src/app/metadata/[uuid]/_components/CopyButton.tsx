"use client";

import { Button } from "@kv-designsystem/react";
import { CheckmarkIcon, FilesIcon } from "@navikt/aksel-icons";
import type { MouseEvent } from "react";
import { useCopyUrl } from "@/app/metadata/[uuid]/_utils/hooks";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./CopyButton.module.css";

export function CopyButton({
  url,
  className,
  eventName = "copy-link",
  trackingProperties,
  preventAccordionToggle = false,
  size,
}: {
  url: string;
  className?: string;
  eventName?: string;
  trackingProperties?: Record<string, unknown>;
  preventAccordionToggle?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { copied, copy } = useCopyUrl(url);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (preventAccordionToggle) {
      event.preventDefault();
      event.stopPropagation();
    }

    trackClick(eventName, LOCATIONS.MetadataPageTabs, trackingProperties);
    copy();
  };

  return (
    <Button
      variant="secondary"
      className={className}
      onClick={handleClick}
      data-size={size}
    >
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
