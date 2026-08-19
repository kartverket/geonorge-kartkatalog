"use client";

import { Button, Card, Tag } from "@kv-designsystem/react";
import {
  CheckmarkIcon,
  ExternalLinkIcon,
  FilesIcon,
  LayersPlusIcon,
} from "@navikt/aksel-icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import AddToCartButton from "@/app/_components/AddToCartButton";
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
  viewMode?: "grid" | "list";
};

export function DatasetCard({ viewMode = "grid", ...p }: DatasetCardProps) {
  const [copied, setCopied] = useState(false);

  const isService = p.typeTranslated === "Tjeneste";
  const canDownload = p.distributionProtocol === "GEONORGE:DOWNLOAD";
  const canShowMap = !!p.showMapLink && !!p.mapCapabilitiesUrl;
  const canCopy = isService && !!p.getCapabilitiesUrl;
  const canOpenApplication =
    p.typeTranslated === "Applikasjon" && !!p.distributionUrl;

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
            <div className={styles.headerLine}>
              <span>
                {p.typeTranslated}
                {p.organization && (
                  <>
                    {" fra "}
                    <a href="#" className={styles.organizationLink}>
                      {p.organization}
                    </a>
                  </>
                )}
              </span>
            </div>
          )}
          <span className={styles.listItemTitle}>
            <Link href={`/metadata/${p.uuid}`}>{p.title}</Link>
          </span>
          <div className={styles.metaGroup}>
            {!!p.protocolNames?.length && (
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
        </div>
        <div className={styles.buttonGroupContainer}>
          {canOpenApplication && (
            <CardActionButton
              onClick={() =>
                window.open(p.distributionUrl, "_blank", "noopener")
              }
              label="Nettside"
              icon={<ExternalLinkIcon aria-hidden />}
            />
          )}
          {canShowMap && (
            <CardActionButton
              onClick={() =>
                window.open(p.mapCapabilitiesUrl, "_blank", "noopener")
              }
              label="Vis kart"
              icon={<LayersPlusIcon aria-hidden />}
            />
          )}
          {canDownload && p.distributionUrl && (
            <AddToCartButton
              item={{
                uuid: p.uuid,
                name: p.title,
                distributionUrl: p.distributionUrl,
              }}
              variant="tertiary"
              size="sm"
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
    <Button variant="tertiary" data-size="sm" onClick={onClick}>
      {icon}
      {label}
    </Button>
  );
}
