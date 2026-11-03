"use client";

import { Heading, List, Paragraph } from "@kv-designsystem/react";
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
  hasHydrated: boolean;
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
  hasHydrated,
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

  const showBulkSelection = cards.length > 1;

  return (
    <div className={styles.pageInner}>
      {selectedDownloadCount > 0 ? (
        <div className={styles.infoSection}>
          <Heading level={2} data-size={"xs"}>
            Slik bestiller du for å laste ned:
          </Heading>
          <List.Unordered>
            <List.Item>
              Velg område, projeksjoner og formater.
              {showBulkSelection
                ? " Fellesvalg fylles ut automatisk når datasettet er tilgjengelig for de valgte geografiske områdene, projeksjonene og formatene."
                : null}
            </List.Item>
            {showBulkSelection ? (
              <List.Item>
                Dersom et fellesvalg ikke kan benyttes for alle de valgte
                datasettene, må verdiene angis manuelt. Det vises da et varsel.
              </List.Item>
            ) : null}
          </List.Unordered>
        </div>
      ) : null}
      {!hasHydrated || isLoading ? (
        <Paragraph aria-live="polite">Laster datasett...</Paragraph>
      ) : selectedDownloadCount === 0 ? (
        <Paragraph>Ingen datasett lagt til nedlasting</Paragraph>
      ) : (
        <>
          {hasLoadError ? (
            <Paragraph aria-live="polite">
              Kunne ikke hente alle datasettene lagt til nedlasting.
            </Paragraph>
          ) : null}

          {showBulkSelection ? (
            <BulkDownloadSelectionForm
              optionsList={optionsList}
              isLoading={isLoadingBulkOptions}
              onApplyToAllAction={onApplyToAll}
              isOrdering={isOrdering}
            />
          ) : null}

          <Heading
            level={2}
            data-size={"sm"}
            className={styles.selectedDatasetsHeading}
          >
            Dine valgte datasett ({selectedDownloadCount})
          </Heading>
          <div className={styles.results}>
            {cards.map((card, index) => (
              <DownloadSelectionCard
                key={card.uuid}
                {...card}
                options={optionsByUuid[card.uuid]?.options ?? null}
                isLoadingOptions={optionsByUuid[card.uuid]?.isLoading ?? true}
                optionsError={optionsByUuid[card.uuid]?.error ?? null}
                selection={selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION}
                onSelectionChangeAction={onSelectionChange}
                isOrdering={isOrdering}
                defaultExpanded={index === 0}
              />
            ))}
          </div>

          {productsWithMissingFields.length > 0 ? (
            <MissingInputSummary
              productsWithMissingFields={productsWithMissingFields}
              className={styles.missingSummary}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
