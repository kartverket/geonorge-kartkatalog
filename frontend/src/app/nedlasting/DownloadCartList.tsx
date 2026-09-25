"use client";

import { Heading, Paragraph } from "@kv-designsystem/react";
import { useState } from "react";
import { BulkDownloadSelectionForm } from "./BulkDownloadSelectionForm";
import { DownloadCartCard } from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";
import {
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  type MissingDownloadSelectionField,
} from "./downloadUtils";
import { MissingInputSummary } from "./MissingInputSummary";
import type { DownloadCard } from "./useDownloadCartCards";
import type { DownloadOptionsByUuid } from "./useDownloadOptionsForCards";

type DownloadCartListProps = {
  orderItemsCount: number;
  cards: DownloadCard[];
  isLoading: boolean;
  hasLoadError: boolean;
  optionsByUuid: DownloadOptionsByUuid;
  selections: Record<string, DownloadSelection>;
  productsWithMissingFields: {
    uuid: string;
    title: string;
    missingFields: MissingDownloadSelectionField[];
  }[];
  onSelectionChange: (uuid: string, selection: DownloadSelection) => void;
  onApplyToAll: (
    update: (selection: DownloadSelection) => DownloadSelection,
  ) => void;
};

export function DownloadCartList({
  orderItemsCount,
  cards,
  isLoading,
  hasLoadError,
  optionsByUuid,
  selections,
  productsWithMissingFields,
  onSelectionChange,
  onApplyToAll,
}: DownloadCartListProps) {
  const [bulkSelection, setBulkSelection] = useState<DownloadSelection>(
    EMPTY_DOWNLOAD_SELECTION,
  );

  function handleBulkAreaChange(areaCode: string) {
    setBulkSelection((current) => ({ ...current, areaCode }));
    onApplyToAll((selection) => ({ ...selection, areaCode }));
  }

  function handleBulkProjectionChange(projectionCode: string) {
    setBulkSelection((current) => ({
      ...current,
      projectionCode,
      formatNames: [],
    }));
    onApplyToAll((selection) => ({
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
    onApplyToAll((selection) => ({ ...selection, formatNames }));
  }

  const optionsList = cards.map(
    (card) => optionsByUuid[card.uuid]?.options ?? null,
  );
  const isLoadingBulkOptions = cards.some(
    (card) => optionsByUuid[card.uuid]?.isLoading ?? true,
  );

  return (
    <div className={styles.pageInner}>
      <Heading data-size={"lg"} level={1}>
        Filnedlasting - bestilling
      </Heading>
      <Heading level={2} data-size={"sm"}>
        Dine valgte produkter ({orderItemsCount})
      </Heading>
      {orderItemsCount === 0 ? (
        <Paragraph>Ingen datasett lagt til nedlasting</Paragraph>
      ) : isLoading ? (
        <Paragraph aria-live="polite">Laster datasett...</Paragraph>
      ) : (
        <>
          {hasLoadError ? (
            <Paragraph aria-live="polite">
              Kunne ikke hente alle datasettene lagt til nedlasting.
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
                onSelectionChangeAction={onSelectionChange}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
