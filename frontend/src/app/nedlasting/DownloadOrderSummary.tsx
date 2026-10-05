"use client";

import { Button, Card, Heading, Paragraph, Tag } from "@kv-designsystem/react";
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
import type { DownloadOrderResult } from "@/lib/schemas/download";
import styles from "./DownloadOrderSummary.module.css";
import type { DownloadCard } from "./downloadUtils";

const TYPE_TO_ACCESS_CONTEXT: Record<string, AccessTagContext> = {
  Tjeneste: "tjeneste",
  Tjenestelag: "tjenestelag",
  Applikasjon: "applikasjon",
  Datasettserie: "datasettserie",
};

function triggerDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.click();
}

type GroupedFormat = {
  key: string;
  label: string;
  downloadUrl: string | null;
  isReady: boolean;
};

type GroupedProjection = {
  projectionName: string;
  formats: GroupedFormat[];
};

type GroupedArea = {
  areaName: string;
  projections: GroupedProjection[];
};

type GroupedProduct = {
  uuid: string;
  title: string;
  organization: string | null;
  typeTranslated: string | null;
  accessState: DownloadCard["accessState"];
  isReady: boolean;
  areas: GroupedArea[];
};

function groupOrderedProducts(
  orderResult: DownloadOrderResult,
  cards: DownloadCard[],
): GroupedProduct[] {
  const files = orderResult.orders.flatMap((order) =>
    order.status === "ordered" ? order.files : [],
  );

  const filesByUuid = new Map<string, typeof files>();
  for (const file of files) {
    if (!file.metadataUuid) continue;
    const existing = filesByUuid.get(file.metadataUuid);
    if (existing) {
      existing.push(file);
    } else {
      filesByUuid.set(file.metadataUuid, [file]);
    }
  }

  return Array.from(filesByUuid.entries()).map(([uuid, productFiles]) => {
    const card = cards.find((c) => c.uuid === uuid);
    const isReady = productFiles.every(
      (file) => file.status === "ReadyForDownload",
    );

    const areaNames = Array.from(
      new Set(productFiles.map((file) => file.areaName ?? "Ukjent område")),
    );

    const areas: GroupedArea[] = areaNames.map((areaName) => {
      const areaFiles = productFiles.filter(
        (file) => (file.areaName ?? "Ukjent område") === areaName,
      );
      const projectionNames = Array.from(
        new Set(
          areaFiles.map((file) => file.projectionName ?? "Ukjent projeksjon"),
        ),
      );

      const projections: GroupedProjection[] = projectionNames.map(
        (projectionName) => ({
          projectionName,
          formats: areaFiles
            .filter(
              (file) =>
                (file.projectionName ?? "Ukjent projeksjon") === projectionName,
            )
            .map((file, index) => ({
              key: `${file.metadataUuid}-${areaName}-${projectionName}-${index}`,
              label: file.format ?? file.name ?? "Fil",
              downloadUrl: file.downloadUrl ?? null,
              isReady: file.status === "ReadyForDownload",
            })),
        }),
      );

      return { areaName, projections };
    });

    return {
      uuid,
      title: card?.title ?? productFiles[0]?.metadataName ?? uuid,
      organization: card?.organization ?? null,
      typeTranslated: card?.typeTranslated ?? null,
      accessState: card?.accessState ?? null,
      isReady,
      areas,
    };
  });
}

function ProductGroup({
  product,
  onProductDownloaded,
}: {
  product: GroupedProduct;
  onProductDownloaded: (uuid: string) => void;
}) {
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
                    {projection.formats.map((format) =>
                      format.isReady && format.downloadUrl ? (
                        <a
                          key={format.key}
                          className={styles.formatButton}
                          href={format.downloadUrl}
                          onClick={() => onProductDownloaded(product.uuid)}
                        >
                          <DownloadIcon aria-hidden />
                          {format.label}
                        </a>
                      ) : (
                        <span key={format.key} className={styles.formatPending}>
                          {format.label} (under behandling)
                        </span>
                      ),
                    )}
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

export function DownloadOrderSummary({
  orderResult,
  cards,
  onProductDownloaded,
}: {
  orderResult: DownloadOrderResult;
  cards: DownloadCard[];
  onProductDownloaded: (uuid: string) => void;
}) {
  const products = groupOrderedProducts(orderResult, cards);
  const readyProducts = products.filter((product) => product.isReady);
  const processingProducts = products.filter((product) => !product.isReady);

  function handleDownloadAll() {
    for (const product of readyProducts) {
      for (const area of product.areas) {
        for (const projection of area.projections) {
          for (const format of projection.formats) {
            if (format.isReady && format.downloadUrl) {
              triggerDownload(format.downloadUrl);
            }
          }
        }
      }
      onProductDownloaded(product.uuid);
    }
  }

  return (
    <div className={styles.summary}>
      {readyProducts.length > 0 ? (
        <section>
          <Heading level={2} data-size="sm">
            Klar til nedlasting ({readyProducts.length})
          </Heading>
          <div className={styles.productList}>
            {readyProducts.map((product) => (
              <ProductGroup
                key={product.uuid}
                product={product}
                onProductDownloaded={onProductDownloaded}
              />
            ))}
          </div>
          <div className={styles.downloadAllButtonContainer}>
            <Button type="button" variant="primary" onClick={handleDownloadAll}>
              <DownloadIcon aria-hidden />
              Last ned alle filformater
            </Button>
          </div>
        </section>
      ) : null}

      {processingProducts.length > 0 ? (
        <section>
          <Heading level={2} data-size="sm">
            Under behandling ({processingProducts.length})
          </Heading>
          <div className={styles.productList}>
            {processingProducts.map((product) => (
              <ProductGroup
                key={product.uuid}
                product={product}
                onProductDownloaded={onProductDownloaded}
              />
            ))}
          </div>
          <Paragraph data-size="sm">
            Du får beskjed på e-post når disse filene er klare for nedlasting.
          </Paragraph>
        </section>
      ) : null}
    </div>
  );
}
