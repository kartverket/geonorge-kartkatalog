"use client";

import {
  Button,
  Card,
  Checkbox,
  Heading,
  Select,
  Tag,
} from "@kv-designsystem/react";
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
import type {
  DownloadOptions,
  DownloadOrderItemInput,
} from "@/lib/schemas/download";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./DownloadCartCard.module.css";
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
    item: DownloadOrderItemInput | null,
  ) => void;
};

const TYPE_TO_ACCESS_CONTEXT: Record<string, AccessTagContext> = {
  Tjeneste: "tjeneste",
  Tjenestelag: "tjenestelag",
  Applikasjon: "applikasjon",
  Datasettserie: "datasettserie",
};

function getAvailableProjections(options: DownloadOptions | null) {
  if (!options) return [];

  return Array.from(
    new Map(
      options.formats
        .flatMap((format) => format.projections)
        .map((projection) => [projection.code, projection]),
    ).values(),
  );
}

function getAvailableFormats(
  options: DownloadOptions | null,
  projectionCode: string,
) {
  if (!options || !projectionCode) return [];

  return options.formats.filter((format) =>
    format.projections.some((projection) => projection.code === projectionCode),
  );
}

function createDownloadOrderItem(
  uuid: string,
  options: DownloadOptions | null,
  areaCode: string,
  projectionCode: string,
  formatNames: string[],
): DownloadOrderItemInput | null {
  const area = options?.areas.find((candidate) => candidate.code === areaCode);
  const projection = getAvailableProjections(options).find(
    (candidate) => candidate.code === projectionCode,
  );
  const formats = getAvailableFormats(options, projectionCode).filter(
    (format) => formatNames.includes(format.name),
  );

  if (!area || !projection || formats.length === 0) return null;

  return {
    uuid,
    areas: [area],
    projections: [projection],
    formats: formats.map((format) => ({ name: format.name })),
  };
}

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
  const [selectedAreaCode, setSelectedAreaCode] = useState("");
  const [selectedProjectionCode, setSelectedProjectionCode] = useState("");
  const [selectedFormatNames, setSelectedFormatNames] = useState<string[]>([]);
  const {
    error: optionsError,
    isLoading: isLoadingOptions,
    options,
  } = useDownloadOptions(uuid, expanded);

  useEffect(() => {
    onSelectionChangeAction?.(
      uuid,
      createDownloadOrderItem(
        uuid,
        options,
        selectedAreaCode,
        selectedProjectionCode,
        selectedFormatNames,
      ),
    );
  }, [
    uuid,
    options,
    selectedAreaCode,
    selectedProjectionCode,
    selectedFormatNames,
    onSelectionChangeAction,
  ]);

  const detailsId = useId();
  const areaId = useId();
  const projectionId = useId();
  const accessContext =
    TYPE_TO_ACCESS_CONTEXT[typeTranslated ?? ""] ?? "datasett";
  const projections = getAvailableProjections(options);
  const availableFormats = getAvailableFormats(options, selectedProjectionCode);

  function toggleFormat(formatName: string) {
    setSelectedFormatNames((current) =>
      current.includes(formatName)
        ? current.filter((name) => name !== formatName)
        : [...current, formatName],
    );
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
              accessIsOpendata: accessState === "open",
              accessIsRestricted: accessState === "restricted",
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
          {isLoadingOptions ? (
            <p>Henter nedlastingsvalg...</p>
          ) : options ? (
            <div className={styles.selectionFields}>
              <div className={styles.selectionField}>
                <label className={styles.fieldLabel} htmlFor={areaId}>
                  Område
                </label>
                <Select
                  id={areaId}
                  value={selectedAreaCode}
                  onChange={(event) => setSelectedAreaCode(event.target.value)}
                >
                  <Select.Option value="">Velg område</Select.Option>
                  {options.areas.map((area) => (
                    <Select.Option key={area.code} value={area.code}>
                      {area.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div className={styles.selectionField}>
                <label className={styles.fieldLabel} htmlFor={projectionId}>
                  Projeksjon
                </label>
                <Select
                  id={projectionId}
                  value={selectedProjectionCode}
                  onChange={(event) => {
                    setSelectedProjectionCode(event.target.value);
                    setSelectedFormatNames([]);
                  }}
                >
                  <Select.Option value="">Velg projeksjon</Select.Option>
                  {projections.map((projection) => (
                    <Select.Option
                      key={projection.code}
                      value={projection.code}
                    >
                      {projection.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              {selectedProjectionCode ? (
                <fieldset className={styles.formatField}>
                  <legend className={styles.fieldLabel}>Format</legend>
                  <div className={styles.formatOptions}>
                    {availableFormats.map((format) => (
                      <Checkbox
                        key={format.name}
                        label={format.name}
                        value={format.name}
                        checked={selectedFormatNames.includes(format.name)}
                        onChange={() => toggleFormat(format.name)}
                      />
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </div>
          ) : (
            <p>
              Kunne ikke hente nedlastingsvalg for dette datasettet.
              {optionsError ? ` ${optionsError}` : null}
            </p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
