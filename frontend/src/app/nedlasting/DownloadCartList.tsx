"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { useCallback, useState } from "react";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import type { DownloadOrderItemInput } from "@/lib/schemas/download";
import { DownloadCartCard } from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";
import { useDownloadCartCards } from "./useDownloadCartCards";
import { useDownloadOrder } from "./useDownloadOrder";

export function DownloadCartList() {
  const orderItems = useOrderItems();
  const { cards, isLoading, hasLoadError } = useDownloadCartCards(orderItems);
  const { isOrdering, orderError, orderResult, submitOrder } =
    useDownloadOrder();

  const [selections, setSelections] = useState<
    Record<string, DownloadOrderItemInput | null>
  >({});

  const handleSelectionChange = useCallback(
    (uuid: string, item: DownloadOrderItemInput | null) => {
      setSelections((current) => ({ ...current, [uuid]: item }));
    },
    [],
  );

  const cardUuids = new Set(cards.map((card) => card.uuid));
  const selectedItems = Object.entries(selections)
    .filter(([uuid]) => cardUuids.has(uuid))
    .map(([, item]) => item)
    .filter((item): item is DownloadOrderItemInput => item !== null);
  const canOrder = selectedItems.length > 0 && !isOrdering;

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
              <DownloadCartCard
                key={card.uuid}
                {...card}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </div>

          <div className={styles.orderSection}>
            <Button
              onClick={() => submitOrder(selectedItems)}
              disabled={!canOrder}
            >
              {isOrdering ? "Bestiller..." : "Bestill nedlasting"}
            </Button>
            {orderError ? (
              <Paragraph aria-live="polite">{orderError}</Paragraph>
            ) : null}
            {orderResult ? (
              <div>
                {orderResult.orders
                  .flatMap((order) => order.files)
                  .map((file, index) => (
                    <Paragraph key={`${file.metadataUuid}-${index}`}>
                      {file.status === "ReadyForDownload" &&
                      file.downloadUrl ? (
                        <a href={file.downloadUrl}>
                          Last ned {file.name ?? file.metadataName}
                        </a>
                      ) : (
                        <>
                          {file.name ?? file.metadataName} er under behandling.
                          Du får beskjed når den er klar.
                        </>
                      )}
                    </Paragraph>
                  ))}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
