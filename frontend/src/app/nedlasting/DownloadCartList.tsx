"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { useCallback, useState } from "react";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import { MissingInputSummary } from "@/app/nedlasting/MissingInputSummary";
import type { DownloadOptions } from "@/lib/schemas/download";
import { DownloadCartCard } from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";
import {
  createDownloadOrderItem,
  type DownloadSelection,
  getMissingDownloadSelectionFields,
  type MissingDownloadSelectionField,
} from "./downloadUtils";
import { useDownloadCartCards } from "./useDownloadCartCards";
import { useDownloadOrder } from "./useDownloadOrder";

type ProductSelection = {
  options: DownloadOptions | null;
  selection: DownloadSelection;
};

export function DownloadCartList() {
  const orderItems = useOrderItems();
  const { cards, isLoading, hasLoadError } = useDownloadCartCards(orderItems);
  const { isOrdering, orderError, orderResult, submitOrder } =
    useDownloadOrder();
  const [selectionInputs, setSelectionInputs] = useState<
    Record<string, ProductSelection>
  >({});

  const handleSelectionChange = useCallback(
    (
      uuid: string,
      options: DownloadOptions | null,
      selection: DownloadSelection,
    ) => {
      setSelectionInputs((current) => ({
        ...current,
        [uuid]: { options, selection },
      }));
    },
    [],
  );

  const downloadableProducts = cards.flatMap((card) => {
    const productSelection = selectionInputs[card.uuid];

    if (!productSelection) return [];

    const item = createDownloadOrderItem(
      card.uuid,
      productSelection.options,
      productSelection.selection,
    );

    return item ? [item] : [];
  });
  const productsWithMissingFields = cards.flatMap((card) => {
    const productSelection = selectionInputs[card.uuid];
    const missingFields: MissingDownloadSelectionField[] = productSelection
      ? getMissingDownloadSelectionFields(productSelection.selection)
      : ["area", "projection", "format"];

    return missingFields.length > 0 ? [{ ...card, missingFields }] : [];
  });
  const canOrder =
    cards.length === orderItems.length &&
    downloadableProducts.length === cards.length &&
    !isOrdering &&
    !orderResult;

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
              onClick={() => submitOrder(downloadableProducts)}
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
