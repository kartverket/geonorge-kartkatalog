"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { useState } from "react";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import { MissingInputSummary } from "@/app/nedlasting/MissingInputSummary";
import { BulkDownloadSelectionForm } from "./BulkDownloadSelectionForm";
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
  const [bulkSelection, setBulkSelection] = useState<DownloadSelection>(
    EMPTY_DOWNLOAD_SELECTION,
  );

  function handleSelectionChange(uuid: string, selection: DownloadSelection) {
    setSelections((current) => ({ ...current, [uuid]: selection }));
  }

  function applyToAllProducts(
    update: (selection: DownloadSelection) => DownloadSelection,
  ) {
    setSelections((current) => {
      const next = { ...current };
      for (const card of cards) {
        next[card.uuid] = update(next[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION);
      }
      return next;
    });
  }

  function handleBulkAreaChange(areaCode: string) {
    setBulkSelection((current) => ({ ...current, areaCode }));
    applyToAllProducts((selection) => ({ ...selection, areaCode }));
  }

  function handleBulkProjectionChange(projectionCode: string) {
    setBulkSelection((current) => ({
      ...current,
      projectionCode,
      formatNames: [],
    }));
    applyToAllProducts((selection) => ({
      ...selection,
      projectionCode,
      formatNames: [],
    }));
  }

  function handleBulkFormatToggle(formatName: string) {
    const formatNames = bulkSelection.formatNames.includes(formatName)
      ? bulkSelection.formatNames.filter((name) => name !== formatName)
      : [...bulkSelection.formatNames, formatName];

    setBulkSelection((current) => ({ ...current, formatNames }));
    applyToAllProducts((selection) => ({ ...selection, formatNames }));
  }

  const optionsList = cards.map(
    (card) => optionsByUuid[card.uuid]?.options ?? null,
  );
  const isLoadingBulkOptions = cards.some(
    (card) => optionsByUuid[card.uuid]?.isLoading ?? true,
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

          <BulkDownloadSelectionForm
            optionsList={optionsList}
            isLoading={isLoadingBulkOptions}
            onAreaChangeAction={handleBulkAreaChange}
            onFormatToggleAction={handleBulkFormatToggle}
            onProjectionChangeAction={handleBulkProjectionChange}
            selectedAreaCode={bulkSelection.areaCode}
            selectedFormatNames={bulkSelection.formatNames}
            selectedProjectionCode={bulkSelection.projectionCode}
          />

          {productsWithMissingFields.length > 0 ? (
            <MissingInputSummary
              productsWithMissingFields={productsWithMissingFields}
            />
          ) : null}

          <Heading level={2} data-size={"sm"}>
            Velg pr produkt
          </Heading>
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
