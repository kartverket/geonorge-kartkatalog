"use client";

import { Details } from "@kv-designsystem/react";
import type { MouseEvent, ReactNode } from "react";
import {
  type Field,
  FieldList,
  getVisibleFields,
} from "@/app/metadata/[uuid]/_components/shared/FieldList";
import styles from "@/app/metadata/[uuid]/_components/tabs/ProductTabs.module.css";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

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

/** Accordion with a field list; hidden when no field has a value. */
export function FieldAccordion({
  title,
  actionButton,
  fields,
}: {
  title: string;
  actionButton?: ReactNode;
  fields: Field[];
}) {
  if (getVisibleFields(fields).length === 0) return null;

  return (
    <DetailAccordion title={title} actionButton={actionButton}>
      <FieldList fields={fields} />
    </DetailAccordion>
  );
}
