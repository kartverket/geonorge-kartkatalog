"use client";

import { Button, Card, Tag } from "@kv-designsystem/react";
import Link from "next/link";
import { useState } from "react";
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
  protocolName?: string;
  formats?: string[];
  category?: "application" | "view-service" | "download-service";
  showThumbnail?: boolean;
  viewMode?: "grid" | "list";
};

export function DatasetCard({ viewMode = "grid", ...p }: DatasetCardProps) {
  const [copied, setCopied] = useState(false);

  const isService = p.typeTranslated === "Tjeneste";
  const canDownload = p.distributionProtocol === "GEONORGE:DOWNLOAD";
  const canShowMap = !!p.showMapLink && !!p.mapCapabilitiesUrl;
  const canCopy = isService && !!p.getCapabilitiesUrl;
  const canOpenApplication =
    p.category === "application" && !!p.distributionUrl;

  async function copyUrl() {
    if (!p.getCapabilitiesUrl) return;
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
    <div
      className={`${styles.listItem} ${
        viewMode === "list" ? styles.listMode : styles.gridMode
      }`}
    >
      <Card
        data-color="neutral"
        variant="tinted"
        className={styles.productCard}
      >
        {p.showThumbnail !== false && renderThumbnail()}
        <div className={styles.contentWrapper}>
          {p.typeTranslated && (
            <div className={styles.typeContainer}>
              <span>
                {p.organization
                  ? `${p.typeTranslated} fra ${p.organization}`
                  : p.typeTranslated}
              </span>
            </div>
          )}
          <span className={styles.listItemTitle}>
            <Link href={`/metadata/${p.uuid}`}>{p.title}</Link>
          </span>
          <div className={styles.flex}>
            {p.protocolName && (
              <div className={styles.typeContainer}>
                <span>Type: {p.protocolName}</span>
              </div>
            )}
            {!!p.formats?.length && (
              <div className={styles.formatList}>
                <span>Formater:</span>
                {p.formats.map((f) => (
                  <Tag key={f} data-size="sm">
                    {f}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.buttonGroupContainer}>
          {canOpenApplication && (
            <Button
              variant="secondary"
              data-size="md"
              onClick={() =>
                window.open(p.distributionUrl, "_blank", "noopener")
              }
            >
              Nettside
            </Button>
          )}
          {canShowMap && (
            <Button
              variant="secondary"
              data-size="md"
              onClick={() =>
                window.open(p.mapCapabilitiesUrl, "_blank", "noopener")
              }
              className={""}
            >
              Vis kart
            </Button>
          )}
          {canDownload && p.distributionUrl && (
            <Button
              variant="secondary"
              data-size="md"
              onClick={() =>
                window.open(p.distributionUrl, "_blank", "noopener")
              }
            >
              Last ned
            </Button>
          )}
          {canCopy && (
            <Button variant="primary" onClick={copyUrl}>
              {copied ? "Lenke kopiert" : "Kopier lenke"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
