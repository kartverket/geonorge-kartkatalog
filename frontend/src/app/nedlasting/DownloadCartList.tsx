"use client";

import { Heading, Paragraph } from "@kv-designsystem/react";
import { BulkDownloadSelectionForm } from "./BulkDownloadSelectionForm";
import { DownloadCartCard } from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";
import {
  type DownloadCard,
  type DownloadOptionsByUuid,
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  type MissingDownloadSelectionField,
} from "./downloadUtils";
import { MissingInputSummary } from "./MissingInputSummary";

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
  isOrdering?: boolean;
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
  isOrdering = false,
}: DownloadCartListProps) {
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
      {orderItemsCount > 0 ? (
        <Paragraph data-size="sm">
          Ditt nedlastingsvalg lagres i nettleseren, brukes når du laster ned
          filer, og glemmes når du avslutter besøket på siden. Du kan bytte
          nedlastingsvalg når som helst.
        </Paragraph>
      ) : null}
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
            onApplyToAll={onApplyToAll}
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
              <DownloadCartCard
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
