"use client";

import { Button, Card, Heading, Tag } from "@kv-designsystem/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
} from "@navikt/aksel-icons";
import { useEffect, useId, useState } from "react";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import {
  AccessStateTag,
  type AccessTagContext,
} from "@/components/AccessStateTag/AccessStateTag";
import type { DownloadOptions } from "@/lib/schemas/download";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./DownloadCartCard.module.css";
import { DownloadOptionsForm } from "./DownloadOptionsForm";
import { type DownloadSelection, getAvailableFormats } from "./downloadUtils";
import { useDownloadOptions } from "./useDownloadOptions";

export type DownloadCartCardProps = {
  uuid: string;
  title: string;
  organization: string | null;
  typeTranslated: string | null;
  accessState: "restricted" | "open" | "protected" | null;
  distributionUrl: string;
  onSelectionChangeAction?: (
    uuid: string,
    options: DownloadOptions | null,
    selection: DownloadSelection,
  ) => void;
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
  onSelectionChangeAction,
}: DownloadCartCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedAreaCode, setSelectedAreaCode] = useState<string[]>([]);
  const [selectedProjectionCodes, setSelectedProjectionCodes] = useState<
    string[]
  >([]);
  const [selectedFormatNames, setSelectedFormatNames] = useState<string[]>([]);
  const {
    error: optionsError,
    isLoading: isLoadingOptions,
    options,
  } = useDownloadOptions(uuid, expanded);

  useEffect(() => {
    const selection = {
      areaCode: selectedAreaCode,
      formatNames: selectedFormatNames,
      projectionCodes: selectedProjectionCodes,
    };

    onSelectionChangeAction?.(uuid, options, selection);
  }, [
    uuid,
    options,
    selectedAreaCode,
    selectedProjectionCodes,
    selectedFormatNames,
    onSelectionChangeAction,
  ]);

  const detailsId = useId();
  const accessContext =
    TYPE_TO_ACCESS_CONTEXT[typeTranslated ?? ""] ?? "datasett";

  function changeFormat(formatNames: string[]) {
    setSelectedFormatNames(formatNames);
  }

  function changeProjection(projectionCodes: string[]) {
    setSelectedProjectionCodes(projectionCodes);
    setSelectedFormatNames((current) => {
      const availableFormatNames = new Set(
        getAvailableFormats(options, projectionCodes).map(
          (format) => format.name,
        ),
      );

      return current.filter((formatName) =>
        availableFormatNames.has(formatName),
      );
    });
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
            onAreaChangeAction={setSelectedAreaCode}
            onFormatChangeAction={changeFormat}
            onProjectionChangeAction={changeProjection}
            options={options}
            selectedAreaCode={selectedAreaCode}
            selectedFormatNames={selectedFormatNames}
            selectedProjectionCodes={selectedProjectionCodes}
          />
        </div>
      ) : null}
    </Card>
  );
}
