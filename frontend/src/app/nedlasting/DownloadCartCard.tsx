"use client";

import { Button, Card, Heading, Tag } from "@kv-designsystem/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
} from "@navikt/aksel-icons";
import { useId, useState } from "react";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import {
  AccessStateTag,
  type AccessTagContext,
} from "@/components/AccessStateTag/AccessStateTag";
import type { DownloadOptions } from "@/lib/schemas/download";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./DownloadCartCard.module.css";
import { DownloadOptionsForm } from "./DownloadOptionsForm";
import type { DownloadSelection } from "./downloadUtils";

export type DownloadCartCardProps = {
  uuid: string;
  title: string;
  organization: string | null;
  typeTranslated: string | null;
  accessState: "restricted" | "open" | "protected" | null;
  distributionUrl: string;
  options: DownloadOptions | null;
  isLoadingOptions: boolean;
  optionsError: string | null;
  selection: DownloadSelection;
  onSelectionChangeAction: (uuid: string, selection: DownloadSelection) => void;
};

const TYPE_TO_ACCESS_CONTEXT: Record<string, AccessTagContext> = {
  Tjeneste: "tjeneste",
  Tjenestelag: "tjenestelag",
  Applikasjon: "applikasjon",
  Datasettserie: "datasettserie",
};

export function DownloadCartCard({
  uuid,
  title,
  organization,
  typeTranslated,
  accessState,
  distributionUrl,
  options,
  isLoadingOptions,
  optionsError,
  selection,
  onSelectionChangeAction,
}: DownloadCartCardProps) {
  const [expanded, setExpanded] = useState(false);

  const detailsId = useId();
  const accessContext =
    TYPE_TO_ACCESS_CONTEXT[typeTranslated ?? ""] ?? "datasett";

  function changeArea(areaCode: string) {
    onSelectionChangeAction(uuid, { ...selection, areaCode });
  }

  function changeProjection(projectionCode: string) {
    onSelectionChangeAction(uuid, {
      ...selection,
      projectionCode,
      formatNames: [],
    });
  }

  function toggleFormat(formatName: string) {
    const formatNames = selection.formatNames.includes(formatName)
      ? selection.formatNames.filter((name) => name !== formatName)
      : [...selection.formatNames, formatName];
    onSelectionChangeAction(uuid, { ...selection, formatNames });
  }

  return (
    <Card data-color="neutral" className={styles.card}>
      <div className={styles.infoRow}>
        <div className={styles.info}>
          <Button
            variant="tertiary"
            data-size="sm"
            className={
              expanded
                ? `${styles.expandButton} ${styles.expanded}`
                : styles.expandButton
            }
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={expanded ? "Skjul detaljer" : "Vis detaljer"}
            onClick={() => setExpanded((isExpanded) => !isExpanded)}
          >
            {expanded ? (
              <ChevronUpIcon aria-hidden />
            ) : (
              <ChevronDownIcon aria-hidden />
            )}
          </Button>
          <div className={styles.titleAndTags}>
            {typeTranslated ? (
              <div className={styles.badgeRow}>
                <AccessStateTag
                  accessState={accessState}
                  context={accessContext}
                />
                <Tag
                  data-color="neutral"
                  data-size="sm"
                  className={styles.typeTag}
                >
                  {organization ?? typeTranslated}
                </Tag>
              </div>
            ) : null}
            <Heading level={3} data-size={"xs"}>
              {title}
            </Heading>
          </div>
        </div>
        <div className={styles.actions}>
          <Button
            className={styles.productPageButton}
            asChild
            variant="secondary"
            data-size={"sm"}
          >
            <a
              href={`/metadata/${uuid}`}
              onClick={() =>
                trackClick("open-dataset-card", LOCATIONS.DownloadPage, {
                  datasetTitle: title,
                  datasetUuid: uuid,
                })
              }
            >
              <ExternalLinkIcon aria-hidden={"true"} />
              <span>Vis produktsiden</span>
            </a>
          </Button>
          <AddToCartButton
            item={{
              accessType: accessState,
              uuid,
              name: title,
              organizationName: organization,
              distributionUrl,
            }}
            location={LOCATIONS.DownloadPage}
            variant="secondary"
            size="sm"
            removeLabel="Fjern fra handlekurv"
          />
        </div>
      </div>
      {expanded ? (
        <div id={detailsId} className={styles.expandedContent}>
          <DownloadOptionsForm
            error={optionsError}
            isLoading={isLoadingOptions}
            onAreaChangeAction={changeArea}
            onFormatToggleAction={toggleFormat}
            onProjectionChangeAction={changeProjection}
            options={options}
            selectedAreaCode={selection.areaCode}
            selectedFormatNames={selection.formatNames}
            selectedProjectionCode={selection.projectionCode}
          />
        </div>
      ) : null}
    </Card>
  );
}
