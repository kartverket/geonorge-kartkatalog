"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { useCallback, useState } from "react";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import { MissingInputSummary } from "@/app/nedlasting/MissingInputSummary";
import { DownloadCartCard } from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";
import {
  createDownloadOrderItem,
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  getMissingDownloadSelectionFields,
} from "./downloadUtils";
import { useDownloadCartCards } from "./useDownloadCartCards";
import { useDownloadOptionsForCards } from "./useDownloadOptionsForCards";
import { useDownloadOrder } from "./useDownloadOrder";

export function DownloadCartList() {
  const orderItems = useOrderItems();
  const { cards, isLoading, hasLoadError } = useDownloadCartCards(orderItems);
  const cardUuids = cards.map((card) => card.uuid);
  const optionsByUuid = useDownloadOptionsForCards(cardUuids);
  const { isOrdering, orderError, orderResult, submitOrder } =
    useDownloadOrder();
  const [selections, setSelections] = useState<
    Record<string, DownloadSelection>
  >({});

  const handleSelectionChange = useCallback(
    (uuid: string, selection: DownloadSelection) => {
      setSelections((current) => ({ ...current, [uuid]: selection }));
    },
    [],
  );

  const downloadableProducts = cards.flatMap((card) => {
    const selection = selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
    const options = optionsByUuid[card.uuid]?.options ?? null;
    const item = createDownloadOrderItem(card.uuid, options, selection);

    return item ? [item] : [];
  });
  const productsWithMissingFields = cards.flatMap((card) => {
    const selection = selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
    const missingFields = getMissingDownloadSelectionFields(selection);

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
                options={optionsByUuid[card.uuid]?.options ?? null}
                isLoadingOptions={optionsByUuid[card.uuid]?.isLoading ?? true}
                optionsError={optionsByUuid[card.uuid]?.error ?? null}
                selection={selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION}
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
