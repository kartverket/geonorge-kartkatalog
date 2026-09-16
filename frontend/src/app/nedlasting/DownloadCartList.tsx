"use client";

import { Heading, Paragraph } from "@kv-designsystem/react";
import { useEffect, useState } from "react";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import { basePath } from "@/lib/basePath";
import { parseProductMetadata } from "@/lib/schemas/product";
import {
  DownloadCartCard,
  type DownloadCartCardProps,
} from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";

type DownloadCard = DownloadCartCardProps;

type StoredDownloadMetadata = {
  accessIsOpendata?: unknown;
  accessIsRestricted?: unknown;
  distributionUrl?: unknown;
  name?: unknown;
  organizationName?: unknown;
};

type CompleteStoredDownloadMetadata = {
  accessIsOpendata: boolean;
  accessIsRestricted: boolean;
  distributionUrl: string;
  name: string;
  organizationName: string | null;
};

function readStoredDownloadMetadata(
  uuid: string,
): StoredDownloadMetadata | null {
  try {
    const item: unknown = JSON.parse(
      localStorage.getItem(`${uuid}.metadata`) || "null",
    );
    return item !== null && typeof item === "object"
      ? (item as StoredDownloadMetadata)
      : null;
  } catch {
    return null;
  }
}

function hasCardMetadata(
  item: StoredDownloadMetadata | null,
): item is CompleteStoredDownloadMetadata {
  return (
    typeof item?.name === "string" &&
    typeof item.distributionUrl === "string" &&
    typeof item.accessIsOpendata === "boolean" &&
    typeof item.accessIsRestricted === "boolean" &&
    (typeof item.organizationName === "string" ||
      item.organizationName === null)
  );
}

function toDownloadCard(
  uuid: string,
  metadata: unknown,
  distributionUrl: string,
): DownloadCard | null {
  if (!distributionUrl) return null;

  const product = parseProductMetadata(metadata);
  return {
    uuid,
    title: product.title,
    organization: product.organization,
    typeTranslated: "Datasett",
    distributionUrl,
    accessState: product.accessState,
  };
}

function toDownloadCardFromStored(
  uuid: string,
  item: CompleteStoredDownloadMetadata,
): DownloadCard {
  return {
    uuid,
    title: item.name,
    organization: item.organizationName,
    typeTranslated: "Datasett",
    distributionUrl: item.distributionUrl,
    accessState: item.accessIsOpendata
      ? "open"
      : item.accessIsRestricted
        ? "restricted"
        : null,
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
          const savedItem = readStoredDownloadMetadata(uuid);
          if (hasCardMetadata(savedItem)) {
            return {
              card: toDownloadCardFromStored(uuid, savedItem),
              failed: false,
            };
          }

          try {
            const response = await fetch(
              `${basePath}/api/metadata/${encodeURIComponent(uuid)}`,
              { signal: controller.signal, cache: "no-store" },
            );
            if (!response.ok) return { card: null, failed: true };

            return {
              card: toDownloadCard(
                uuid,
                await response.json(),
                typeof savedItem?.distributionUrl === "string"
                  ? savedItem.distributionUrl
                  : "",
              ),
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
    <div className={styles.pageInner}>
      <Heading data-size={"lg"} level={1}>
        Filnedlasting - bestilling
      </Heading>
      <Heading level={2} data-size={"sm"}>
        Dine valgte produkter ({orderItems.length})
      </Heading>
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
              <DownloadCartCard key={card.uuid} {...card} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
