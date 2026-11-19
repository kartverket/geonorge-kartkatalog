"use client";

import { Button, Card, Heading, Tag } from "@kv-designsystem/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
} from "@navikt/aksel-icons";
import { useId, useState } from "react";
import {
  AccessStateTag,
  type AccessTagContext,
} from "@/components/AccessStateTag/AccessStateTag";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./DownloadOrderSummary.module.css";
import type { GroupedProduct } from "./downloadOrderGrouping";

const TYPE_TO_ACCESS_CONTEXT: Record<string, AccessTagContext> = {
  Tjeneste: "tjeneste",
  Tjenestelag: "tjenestelag",
  Applikasjon: "applikasjon",
  Datasettserie: "datasettserie",
};

export function ProductGroup({ product }: { product: GroupedProduct }) {
  const [expanded, setExpanded] = useState(true);
  const detailsId = useId();
  const accessContext =
    TYPE_TO_ACCESS_CONTEXT[product.typeTranslated ?? ""] ?? "datasett";

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Button
          variant="tertiary"
          data-size="sm"
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
          <div className={styles.badgeRow}>
            <AccessStateTag
              accessState={product.accessState}
              context={accessContext}
            />
            {product.typeTranslated ? (
              <Tag data-color="neutral" data-size="sm">
                {product.organization ?? product.typeTranslated}
              </Tag>
            ) : null}
          </div>
          <Heading level={3} data-size="xs">
            {product.title}
          </Heading>
        </div>
      </div>
      {expanded ? (
        <div id={detailsId} className={styles.areas}>
          {product.areas.map((area) => (
            <div key={area.areaName} className={styles.area}>
              <Heading level={4} data-size="2xs">
                {area.areaName}
              </Heading>
              <div className={styles.columnHeaderRow}>
                <span>Projeksjon</span>
                <span>Formater</span>
              </div>
              {area.projections.map((projection) => (
                <div
                  key={projection.projectionName}
                  className={styles.projectionRow}
                >
                  <span className={styles.projectionName}>
                    {projection.projectionName}
                  </span>
                  <div className={styles.formatButtons}>
                    {projection.formats.map((format) => {
                      if (format.isReady && format.downloadUrl) {
                        return (
                          <Button key={format.key} asChild variant="primary">
                            <a
                              className={styles.downloadLink}
                              href={format.downloadUrl}
                              target="_blank"
                              rel="noopener"
                              onClick={() => {
                                trackClick(
                                  "download-file",
                                  LOCATIONS.DownloadPage,
                                  {
                                    format: format.label,
                                  },
                                );
                              }}
                            >
                              <DownloadIcon aria-hidden />
                              {format.label}
                            </a>
                          </Button>
                        );
                      }

                      if (format.isFailed) {
                        return (
                          <span
                            key={format.key}
                            className={styles.formatPending}
                          >
                            {format.label}{" "}
                            <Tag data-color="danger" data-size="sm">
                              Ikke tilgjengelig hos leverandøren
                            </Tag>
                          </span>
                        );
                      }

                      return (
                        <span key={format.key} className={styles.formatPending}>
                          {format.label} (under behandling)
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
