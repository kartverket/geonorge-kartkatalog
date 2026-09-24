"use client";

import { Heading, Paragraph } from "@kv-designsystem/react";
import { BulkDownloadSelectionForm } from "./BulkDownloadSelectionForm";
import { DownloadCartCard } from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";
import {
  EMPTY_DOWNLOAD_SELECTION,
  type DownloadSelection,
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
  bulkSelection: DownloadSelection;
  productsWithMissingFields: {
    uuid: string;
    title: string;
    missingFields: MissingDownloadSelectionField[];
  }[];
  onSelectionChange: (uuid: string, selection: DownloadSelection) => void;
  onBulkAreaChange: (areaCode
  onBulkProjectionChange: (projectionCode: string) => void;
  onBulkFormatToggle: (format
};

export function DownloadCartList({
  orderItemsCount,
  cards,
  isLoading,
  hasLoadError,
  optionsByUuid,
  selections,
  bulkSelection,
  productsWithMissingFields,
  onSelectionChange,
  onBulkAreaChange,
  onBulkProjectionChange,
  onBulkFormatToggle,
}: DownloadCartListProps) {
  const optionsList = cards.map(
    (card) => optionsByUuid[cl,
  );
  const isLoadingBulkOptions
    (card) => optionsByUuid[card.uuid]?.isLoading ?? true,
  );

  return (
    <div className={styles.pageInner}>
      <Heading data-size={"lg
        Filnedlasting - bestilling
      </Heading>
      <Heading level={2} data-size={"sm"}>
        Dine valgte produkter
      </Heading>
      {orderItemsCount === 0
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
            onAreaChangeAction={onBulkAreaChange}
            onFormatToggleAction={onBulkFormatToggle}
            onProjectionChangeAction={onBulkProjectionChange}
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