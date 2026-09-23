"use client";

import { Heading, Paragraph } from "@kv-designsystem/react";
import type {DownloadOptions, DownloadOrderItemInput} from "@/lib/schemas/download";
import {
  DownloadCartCard,
  type DownloadCartCardProps,
} from "./DownloadCartCard";
import styles from "./DownloadCartList.module.css";
import {DownloadSelection} from "@/app/nedlasting/downloadUtils";

type DownloadCartListProps = {
  orderItemsCount: number;
  cards: DownloadCartCardProps[];
  isLoading: boolean;
  hasLoadError: boolean;
  onSelectionChange: (
    uuid: string,
    options: DownloadOptions | null,
    selection: DownloadSelection
  ) => void;
};

export function DownloadCartList({
  orderItemsCount,
  cards,
  isLoading,
  hasLoadError,
  onSelectionChange,
}: DownloadCartListProps) {
  return (
    <div className={styles.pageInner}>
      <Heading data-size={"lg"} level={1}>
        Filnedlasting - bestilling
      </Heading>
      <Heading level={2} data-size={"sm"}>
        Dine valgte produkter ({orderItemsCount})
      </Heading>
      {orderItemsCount === 0 ? (
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
                onSelectionChangeAction={onSelectionChange}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
