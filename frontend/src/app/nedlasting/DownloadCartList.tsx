"use client";

import { Heading, Paragraph } from "@kv-designsystem/react";
import { useEffect, useState } from "react";
import { readOrderItems } from "@/app/_components/addToCart/cartStorage";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import {
  DatasetCard,
  type DatasetCardProps,
} from "@/app/_components/DatasetCard/DatasetCard";
import { basePath } from "@/lib/basePath";
import { parseProductMetadata } from "@/lib/schemas/product";
import { LOCATIONS } from "@/posthog/posthog";
import styles from "./DownloadCartList.module.css";

type DownloadCard = Omit<DatasetCardProps, "viewMode">;

function toDownloadCard(uuid: string, metadata: unknown): DownloadCard | null {
  const savedItem = readOrderItems().includes(uuid)
    ? (() => {
        try {
          return JSON.parse(
            localStorage.getItem(`${uuid}.metadata`) || "null",
          ) as {
            distributionUrl?: unknown;
          } | null;
        } catch {
          return null;
        }
      })()
    : null;
  const distributionUrl =
    typeof savedItem?.distributionUrl === "string"
      ? savedItem.distributionUrl
      : null;

  if (!distributionUrl) return null;

  const product = parseProductMetadata(metadata);
  return {
    uuid,
    title: product.title,
    organization: product.organization,
    typeTranslated: "Datasett",
    thumbnailUrl: product.thumbnailUrl,
    distributionUrl,
    distributionProtocol: "GEONORGE:DOWNLOAD",
    getCapabilitiesUrl: null,
    showMapLink: false,
    mapCapabilitiesUrl: null,
    accessState: product.accessState,
    hierarchyLevel: product.hierarchyLevel,
    analyticsLocation: LOCATIONS.DownloadPage,
  };
}

export function DownloadCartList() {
  const orderItems = useOrderItems();
  const [cards, setCards] = useState<DownloadCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    if (orderItems.length === 0) {
      setCards([]);
      setHasLoadError(false);
      setIsLoading(false);
      return () => controller.abort();
    }

    async function loadCards() {
      setIsLoading(true);
      setHasLoadError(false);

      const results = await Promise.all(
        orderItems.map(async (uuid) => {
          try {
            const response = await fetch(
              `${basePath}/api/metadata/${encodeURIComponent(uuid)}`,
              { signal: controller.signal, cache: "no-store" },
            );
            if (!response.ok) return { card: null, failed: true };

            return {
              card: toDownloadCard(uuid, await response.json()),
              failed: false,
            };
          } catch {
            return { card: null, failed: !controller.signal.aborted };
          }
        }),
      );

      if (!controller.signal.aborted) {
        setCards(
          results
            .map((result) => result.card)
            .filter((card): card is DownloadCard => card !== null),
        );
        setHasLoadError(results.some((result) => result.failed));
        setIsLoading(false);
      }
    }

    void loadCards();
    return () => controller.abort();
  }, [orderItems]);

  return (
    <main className={styles.page} data-color="neutral">
      <div className={styles.pageInner}>
        <Heading data-size={"lg"} level={1}>Filnedlastning - bestilling</Heading>
        <Heading level={2} data-size={"sm"}>Dine valgte produkter ({orderItems.length})</Heading>
        {orderItems.length === 0 ? (
          <Paragraph>Ingen datasett lagt i handlekurv</Paragraph>
        ) : isLoading ? (
          <Paragraph aria-live="polite">Laster datasett...</Paragraph>
        ) : (
          <>
            {hasLoadError ? (
              <Paragraph aria-live="polite">
                Kunne ikke hente alle datasettene i handlekurven.
              </Paragraph>
            ) : null}
            <div className={styles.results}>
              {cards.map((card) => (
                <DatasetCard key={card.uuid} viewMode="list" {...card} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
