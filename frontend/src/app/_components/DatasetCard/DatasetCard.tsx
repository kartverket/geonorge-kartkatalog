"use client";

import { Button, Card, Tag } from "@kv-designsystem/react";
import {
  CheckmarkIcon,
  ExternalLinkIcon,
  FilesIcon,
} from "@navikt/aksel-icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import { AccessStateTag } from "@/components/AccessStateTag/AccessStateTag";
import { LOCATIONS, type Location, trackClick } from "@/posthog/posthog";
import AddToMapButton from "@/app/_components/addToMap/AddToMapButton";
import styles from "./DatasetCard.module.css";

export type DatasetCardProps = {
  uuid: string;
  title: string;
  organization?: string;
  typeTranslated?: string;
  thumbnailUrl?: string;
  distributionUrl?: string;
  distributionProtocol?: string;
  getCapabilitiesUrl?: string;
  showMapLink?: boolean;
  mapCapabilitiesUrl?: string;
  protocolNames?: string[];
  formats?: string[];
  showThumbnail?: boolean;
  compact?: boolean;
  viewMode?: "grid" | "list";
  analyticsLocation?: Location;
  accessState: "restricted" | "open" | "protected" | null;
  hierarchyLevel: string | null;
};

export function DatasetCard({
  viewMode = "grid",
  compact = false,
  ...p
}: DatasetCardProps) {
  const [copied, setCopied] = useState(false);
  const analyticsLocation = p.analyticsLocation ?? LOCATIONS.SearchPage;

  const isService = p.typeTranslated === "Tjeneste";
  const isOpen = p.accessState === "open";
  const isDataset = p.hierarchyLevel === "dataset";
  const canDownload = p.distributionProtocol === "GEONORGE:DOWNLOAD";
  const canShowMap = !!p.showMapLink && !!p.mapCapabilitiesUrl;
  const canCopy = isService && !!p.getCapabilitiesUrl;
  const canOpenApplication =
    p.typeTranslated === "Applikasjon" && !!p.distributionUrl;
  const accessContext =
    p.typeTranslated === "Tjeneste"
      ? "tjeneste"
      : p.typeTranslated === "Tjenestelag"
        ? "tjenestelag"
        : p.typeTranslated === "Applikasjon"
          ? "applikasjon"
          : p.typeTranslated === "Datasettserie"
            ? "datasettserie"
            : "datasett";

  async function copyUrl() {
    if (!p.getCapabilitiesUrl) return;

    trackClick("copy-link", analyticsLocation, {
      datasetTitle: p.title,
      datasetUuid: p.uuid,
    });

    await navigator.clipboard.writeText(p.getCapabilitiesUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const renderThumbnail = () => (
    <div className={styles.thumbnailContainer}>
      {p.thumbnailUrl ? (
        <img
          src={p.thumbnailUrl}
          alt=""
          className={styles.thumbnail}
          loading="lazy"
        />
      ) : (
        <div className={styles.thumbnailFallback}>Ingen forhåndsvisning</div>
      )}
    </div>
  );

  return (
    <div className={viewMode === "list" ? styles.listMode : styles.gridMode}>
      <Card data-color="neutral" className={styles.productCard}>
        {viewMode !== "list" && p.showThumbnail !== false && renderThumbnail()}
        <div className={styles.contentWrapper}>
          {p.typeTranslated && (
            <div className={styles.badgeRow}>
              <AccessStateTag
                accessState={p.accessState}
                context={accessContext}
              />
              <Tag
                data-color="neutral"
                data-size="sm"
                className={styles.typeTag}
              >
                {p.organization ?? p.typeTranslated}
              </Tag>
            </div>
          )}
          <span
            className={`${styles.listItemTitle} ${compact ? styles.listItemTitleCompact : ""}`}
          >
            <Link
              href={`/metadata/${p.uuid}`}
              onClick={() =>
                trackClick("open-dataset-card", analyticsLocation, {
                  datasetTitle: p.title,
                  datasetUuid: p.uuid,
                })
              }
            >
              {p.title}
            </Link>
          </span>
          {((!compact && !!p.protocolNames?.length) || !!p.formats?.length) && (
            <div className={styles.metaGroup}>
              {!compact && !!p.protocolNames?.length && (
                <div className={styles.typeRow} data-color="neutral">
                  <span>Type: </span>
                  {p.protocolNames.map((name) => (
                    <Tag key={name} data-size="sm">
                      {name}
                    </Tag>
                  ))}
                </div>
              )}
              {!!p.formats?.length && (
                <div className={styles.formatList} data-color="info">
                  <span>Formater:</span>
                  {p.formats.map((f) => (
                    <Tag key={f} data-size="sm">
                      {f}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.buttonGroupContainer}>
          {canOpenApplication && (
            <CardActionButton
              onClick={() => {
                window.open(p.distributionUrl, "_blank", "noopener");
              }}
              label="Nettside"
              icon={<ExternalLinkIcon aria-hidden />}
            />
          )}
          {canShowMap && (
            <AddToMapButton
              item={{
                addLayers: [],
                DistributionProtocol: "OGC:WMS",
                Uuid: p.uuid,
                Title: p.title,
                GetCapabilitiesUrl: p.mapCapabilitiesUrl ?? null,
              }}
              variant="secondary"
              size="sm"
              location={analyticsLocation}
            />
          )}
          {canDownload && isOpen && isDataset && p.distributionUrl && (
            <AddToCartButton
              item={{
                uuid: p.uuid,
                name: p.title,
                distributionUrl: p.distributionUrl,
              }}
              location={analyticsLocation}
              variant="secondary"
              size="sm"
              addLabel="Last ned"
              removeLabel="Fjern nedlasting"
            />
          )}
          {canCopy && (
            <CardActionButton
              onClick={copyUrl}
              label={copied ? "Lenke kopiert" : "Kopier lenke"}
              icon={
                copied ? (
                  <CheckmarkIcon aria-hidden />
                ) : (
                  <FilesIcon aria-hidden />
                )
              }
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function CardActionButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Button variant="secondary" data-size="sm" onClick={onClick}>
      {icon}
      {label}
    </Button>
  );
}
