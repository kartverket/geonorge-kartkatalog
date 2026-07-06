"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card } from "@digdir/designsystemet-react";
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
  viewMode?: "grid" | "list";
};

export function DatasetCard({ viewMode = "grid", ...p }: DatasetCardProps) {
  const [copied, setCopied] = useState(false);

  const isService = p.typeTranslated === "Tjeneste";
  const canDownload = p.distributionProtocol === "GEONORGE:DOWNLOAD";
  const canShowMap = !!p.showMapLink && !!p.mapCapabilitiesUrl;
  const canCopy = isService && !!p.getCapabilitiesUrl;

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
      <Card data-color="neutral" variant="tinted">
        {renderThumbnail()}
        <div className={styles.contentWrapper}>
          <span className={styles.listItemTitle}>
            <Link href={`/metadata/${p.uuid}`}>{p.title}</Link>
          </span>
          <div className={styles.flex}>
            {p.typeTranslated && (
              <div className={styles.typeContainer}>
                <span>
                  {p.organization
                    ? `${p.organization} · ${p.typeTranslated}`
                    : p.typeTranslated}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.buttonGroupContainer}>
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
              {copied ? "Kopiert" : "Kopier URL"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
