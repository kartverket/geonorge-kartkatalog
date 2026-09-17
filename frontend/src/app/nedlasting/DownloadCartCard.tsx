"use client";

import { Button, Card, Heading, Select, Tag } from "@kv-designsystem/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
} from "@navikt/aksel-icons";
import { useEffect, useId, useState } from "react";
import type { DownloadOrderItemInput } from "@/app/api";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import {
  AccessStateTag,
  type AccessTagContext,
} from "@/components/AccessStateTag/AccessStateTag";
import { basePath } from "@/lib/basePath";
import type { DownloadOptions } from "@/lib/schemas/download";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./DownloadCartCard.module.css";

export type DownloadCartCardProps = {
  uuid: string;
  title: string;
  organization: string | null;
  typeTranslated: string | null;
  accessState: "restricted" | "open" | "protected" | null;
  distributionUrl: string;
  onSelectionChange?: (
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

export function DownloadCartCard({
  uuid,
  title,
  organization,
  typeTranslated,
  accessState,
  distributionUrl,
  onSelectionChange,
}: DownloadCartCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<DownloadOptions | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!expanded || options || isLoadingOptions) return;

    let cancelled = false;
    setIsLoadingOptions(true);

    fetch(`${basePath}/api/download/options/${encodeURIComponent(uuid)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DownloadOptions | null) => {
        if (cancelled || !data) return;
        setOptions(data);
        setSelectedFormat(data.formats[0] ?? null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, options, uuid]);

  useEffect(() => {
    if (!options || !selectedFormat) {
      onSelectionChange?.(uuid, null);
      return;
    }

    onSelectionChange?.(uuid, {
      uuid,
      formats: [{ name: selectedFormat }],
      areas: options.defaultArea ? [options.defaultArea] : [],
      projections: options.defaultProjection ? [options.defaultProjection] : [],
    });
  }, [uuid, options, selectedFormat, onSelectionChange]);

  const detailsId = useId();
  const accessContext =
    TYPE_TO_ACCESS_CONTEXT[typeTranslated ?? ""] ?? "datasett";

  return (
    <Card data-color="neutral" className={styles.card}>
      <div className={styles.content}>
        {typeTranslated ? (
          <div className={styles.badgeRow}>
            <AccessStateTag accessState={accessState} context={accessContext} />
            <Tag data-color="neutral" data-size="sm" className={styles.typeTag}>
              {organization ?? typeTranslated}
            </Tag>
          </div>
        ) : null}
        <Heading level={3} data-size={"xs"}>
          {title}
        </Heading>
        {expanded ? (
          <div id={detailsId} className={styles.expandedContent}>
            {isLoadingOptions ? (
              <p>Henter formater...</p>
            ) : options ? (
              <Select
                aria-label="Velg format"
                width="auto"
                value={selectedFormat ?? ""}
                onChange={(e) => setSelectedFormat(e.target.value)}
              >
                {options.formats.map((format) => (
                  <Select.Option key={format} value={format}>
                    {format}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <p>Kunne ikke hente formater for dette datasettet.</p>
            )}
          </div>
        ) : null}
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
      </div>
    </Card>
  );
}
