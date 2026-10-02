"use client";

import { Heading, Paragraph } from "@kv-designsystem/react";
import { BulkDownloadSelectionForm } from "./BulkDownloadSelectionForm";
import { DownloadSelectionCard } from "./DownloadSelectionCard";
import styles from "./DownloadSelectionList.module.css";
import {
  type DownloadCard,
  type DownloadOptionsByUuid,
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  type MissingDownloadSelectionField,
} from "./downloadUtils";
import { MissingInputSummary } from "./MissingInputSummary";

type DownloadSelectionListProps = {
  selectedDownloadCount: number;
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
  onApplyToAll: (bulkSelection: DownloadSelection) => void;
  isOrdering?: boolean;
};

export function DownloadSelectionList({
  selectedDownloadCount,
  cards,
  isLoading,
  hasLoadError,
  optionsByUuid,
  selections,
  productsWithMissingFields,
  onSelectionChange,
  onApplyToAll,
  isOrdering = false,
}: DownloadSelectionListProps) {
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
        Dine valgte produkter ({selectedDownloadCount})
      </Heading>
      {selectedDownloadCount > 0 ? (
        <Paragraph data-size="sm">
          Ditt nedlastingsvalg lagres i nettleseren, brukes når du laster ned
          filer, og glemmes når fanen lukkes. Du kan bytte nedlastingsvalg når
          som helst.
        </Paragraph>
      ) : null}
      {selectedDownloadCount === 0 ? (
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
            onApplyToAllAction={onApplyToAll}
            isOrdering={isOrdering}
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
              <DownloadSelectionCard
                key={card.uuid}
                {...card}
                options={optionsByUuid[card.uuid]?.options ?? null}
                isLoadingOptions={optionsByUuid[card.uuid]?.isLoading ?? true}
                optionsError={optionsByUuid[card.uuid]?.error ?? null}
                selection={selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION}
                onSelectionChangeAction={onSelectionChange}
                isOrdering={isOrdering}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
