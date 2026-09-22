"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { useCallback, useState } from "react";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import { MissingInputSummary } from "@/app/nedlasting/MissingInputSummary";
import type { DownloadOrderItemInput } from "@/lib/schemas/download";
import { DownloadCartCard } from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";
import {
  type DownloadSelection,
  getMissingDownloadSelectionFields,
  type MissingDownloadSelectionField,
} from "./downloadUtils";
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
  const [selectionInputs, setSelectionInputs] = useState<
    Record<string, DownloadSelection>
  >({});

  const handleSelectionChange = useCallback(
    (
      uuid: string,
      item: DownloadOrderItemInput | null,
      selection: DownloadSelection,
    ) => {
      setSelections((current) => ({ ...current, [uuid]: item }));
      setSelectionInputs((current) => ({ ...current, [uuid]: selection }));
    },
    [],
  );

  const cardUuids = new Set(cards.map((card) => card.uuid));
  const selectedItems = Object.entries(selections)
    .filter(([uuid]) => cardUuids.has(uuid))
    .map(([, item]) => item)
    .filter((item): item is DownloadOrderItemInput => item !== null);
  const productsWithMissingFields = cards.flatMap((card) => {
    const selection = selectionInputs[card.uuid];
    const missingFields: MissingDownloadSelectionField[] = selection
      ? getMissingDownloadSelectionFields(selection)
      : ["area", "projection", "format"];

    return missingFields.length > 0 ? [{ ...card, missingFields }] : [];
  });
  const canOrder =
    cards.length === orderItems.length &&
    selectedItems.length === cards.length &&
    !isOrdering;

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
                onSelectionChangeAction={handleSelectionChange}
              />
            ))}
          </div>
          {productsWithMissingFields.length > 0 ? (
            <MissingInputSummary
              productsWithMissingFields={productsWithMissingFields}
            />
          ) : null}

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
