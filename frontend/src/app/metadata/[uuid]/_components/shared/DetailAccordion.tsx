"use client";

import { Details } from "@kv-designsystem/react";
import type { MouseEvent, ReactNode } from "react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./DetailAccordion.module.css";

export function DetailAccordion({
  title,
  actionButton,
  children,
}: {
  title: string;
  actionButton?: ReactNode;
  children: ReactNode;
}) {
  const onClick = (event: MouseEvent<HTMLElement>) => {
    const detailsElement = event.currentTarget.closest("details");

    trackClick("toggle-accordion", LOCATIONS.MetadataPageTabs, {
      accordionTitle: title,
      isExpanded: !detailsElement?.open,
    });
  };

  return (
    <Details>
      <Details.Summary className={styles.detailsSummary} onClick={onClick}>
        <div className={styles.accordionSummary}>
          {title} {actionButton}
        </div>
      </Details.Summary>
      <Details.Content>{children}</Details.Content>
    </Details>
  );
}
