"use client";

import { Heading, List, Paragraph } from "@kv-designsystem/react";
import { BulkDownloadSelectionForm } from "./BulkDownloadSelectionForm";
import { DownloadSelectionCard } from "./DownloadSelectionCard";
import styles from "./DownloadSelectionList.module.css";
import {
  type DownloadAreaBlock,
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
  onApplyToAll: (bulkBlock: DownloadAreaBlock) => void;
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
      {selectedDownloadCount > 0 ? (
        <div className={styles.infoSection}>
          <Heading level={2} data-size={"xs"}>
            Slik bestiller du for å laste ned:
          </Heading>
          <List.Unordered>
            <List.Item>
              Velg område, projeksjoner og formater. Fellesvalg fylles ut
              automatisk når datasettet er tilgjengelig for de valgte
              geografiske områdene, projeksjonene og formatene.
            </List.Item>
            <List.Item>
              Dersom et fellesvalg ikke kan benyttes for alle de valgte
              datasettene, må verdiene angis manuelt. Det vises da et varsel.
            </List.Item>
          </List.Unordered>
        </div>
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

          <Heading
            level={2}
            data-size={"sm"}
            className={styles.selectedDatasetsHeading}
          >
            Dine valgte datasett ({selectedDownloadCount})
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
