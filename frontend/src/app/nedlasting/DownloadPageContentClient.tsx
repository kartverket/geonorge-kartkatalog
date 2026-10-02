"use client";

import {
  Button,
  Field,
  Heading,
  Input,
  Label,
  Paragraph,
  Select,
} from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import { type SubmitEventHandler, useEffect, useState } from "react";
import {
  clearDownloads,
  removeItemsFromDownloads,
} from "@/app/_components/addToDownloads/downloadStorage";
import { useSelectedDownloadUuids } from "@/app/_components/addToDownloads/useDownloads";
import {
  createDownloadOrderItem,
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  filterSelectionForProduct,
  getMissingDownloadSelectionFields,
} from "@/app/nedlasting/downloadUtils";
import { MultiSuggestion } from "@/app/nedlasting/MultiSuggestion";
import type { DownloadInsightGroups } from "@/lib/schemas/download";
import styles from "./DownloadPageContent.module.css";
import { DownloadSelectionList } from "./DownloadSelectionList";
import { useDownloadCards } from "./useDownloadCards";
import { useDownloadOptionsForCards } from "./useDownloadOptionsForCards";
import { useDownloadOrder } from "./useDownloadOrder";
import { usePersistedDownloadSelections } from "./usePersistedDownloadSelections";

type DownloadPageContentClientProps = {
  insightGroups: DownloadInsightGroups;
};

export function DownloadPageContentClient({
  insightGroups,
}: DownloadPageContentClientProps) {
  const selectedDownloadUuids = useSelectedDownloadUuids();
  const { cards, isLoading, hasLoadError } = useDownloadCards(
    selectedDownloadUuids,
  );
  const optionsByUuid = useDownloadOptionsForCards(
    cards.map((card) => ({
      uuid: card.uuid,
      capabilitiesUrl: card.distributionUrl,
    })),
  );
  const { isOrdering, orderError, orderResult, submitOrder } =
    useDownloadOrder();

  const [selections, setSelections] = usePersistedDownloadSelections();
  const [email, setEmail] = useState("");
  const [usageGroup, setUsageGroup] = useState("");
  const [usagePurpose, setUsagePurpose] = useState<string[]>([]);

  function handleSelectionChange(uuid: string, selection: DownloadSelection) {
    setSelections((current) => ({ ...current, [uuid]: selection }));
  }

  function applyToAllProducts(bulkSelection: DownloadSelection) {
    setSelections((current) => {
      const next = { ...current };
      for (const card of cards) {
        const options = optionsByUuid[card.uuid]?.options ?? null;
        next[card.uuid] = filterSelectionForProduct(options, bulkSelection);
      }
      return next;
    });
  }

  useEffect(() => {
    if (selectedDownloadUuids.length === 0) return;

    const selectedUuids = new Set(selectedDownloadUuids);

    setSelections((current) => {
      const stillRelevant = Object.entries(current).filter(([uuid]) =>
        selectedUuids.has(uuid),
      );

      return stillRelevant.length === Object.keys(current).length
        ? current
        : Object.fromEntries(stillRelevant);
    });
  }, [selectedDownloadUuids, setSelections]);

  const downloadableProducts = cards.flatMap((card) => {
    const selection = selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
    const options = optionsByUuid[card.uuid]?.options ?? null;
    const item = createDownloadOrderItem(
      card.uuid,
      card.distributionUrl,
      options,
      selection,
    );

    return item ? [item] : [];
  });

  const productsWithMissingFields = cards.flatMap((card) => {
    const selection = selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
    const missingFields = getMissingDownloadSelectionFields(selection);

    return missingFields.length > 0 ? [{ ...card, missingFields }] : [];
  });

  const canOrder =
    cards.length > 0 &&
    cards.length === selectedDownloadUuids.length &&
    downloadableProducts.length === cards.length &&
    email.trim() !== "" &&
    usageGroup !== "" &&
    usagePurpose.length > 0 &&
    !isOrdering;

  const hasInsightGroupOptions =
    insightGroups.brukergrupper.length > 0 && insightGroups.formal.length > 0;

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!canOrder) {
      return;
    }

    void submitOrder({
      email: email.trim(),
      usageGroup,
      items: downloadableProducts.map((item) => ({
        ...item,
        usagePurpose,
      })),
    }).then((result) => {
      if (!result) return;

      const successfulUuids = new Set(
        result.orders
          .filter((order) => order.status === "ordered")
          .flatMap((order) => order.files)
          .flatMap((file) => (file.metadataUuid ? [file.metadataUuid] : [])),
      );

      const successfulItems = cards
        .filter((card) => successfulUuids.has(card.uuid))
        .map((card) => ({
          accessType: card.accessState,
          distributionUrl: card.distributionUrl,
          name: card.title,
          organizationName: card.organization,
          uuid: card.uuid,
        }));

      if (successfulItems.length > 0) {
        removeItemsFromDownloads(successfulItems);
      }
    });
  };

  return (
    <>
      <DownloadSelectionList
        selectedDownloadCount={selectedDownloadUuids.length}
        cards={cards}
        isLoading={isLoading}
        hasLoadError={hasLoadError}
        optionsByUuid={optionsByUuid}
        selections={selections}
        productsWithMissingFields={productsWithMissingFields}
        onSelectionChange={handleSelectionChange}
        onApplyToAll={applyToAllProducts}
        isOrdering={isOrdering}
      />
      {selectedDownloadUuids.length > 0 || orderResult ? (
        <section className={styles.orderSectionWrapper}>
          <section className={styles.orderSection}>
            <Heading level={2} data-size={"sm"}>
              Vennligst fyll ut
            </Heading>
            <form onSubmit={handleSubmit}>
              <div className={styles.userInputs}>
                <Field>
                  <Label>Brukergruppe</Label>
                  <Select
                    value={usageGroup}
                    onChange={(event) => setUsageGroup(event.target.value)}
                    disabled={isOrdering}
                  >
                    <Select.Option value="">Velg brukergruppe</Select.Option>
                    {insightGroups.brukergrupper.map((group) => (
                      <Select.Option key={group} value={group}>
                        {group}
                      </Select.Option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Formål</Label>
                  <MultiSuggestion
                    selectedValues={usagePurpose}
                    onChangeAction={setUsagePurpose}
                    options={insightGroups.formal.map((purpose) => ({
                      label: purpose,
                      value: purpose,
                    }))}
                    placeholder="Velg formål"
                    isOrdering={isOrdering}
                  />
                </Field>
                <Field>
                  <Label>E-post</Label>
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isOrdering}
                    required
                  />
                </Field>
              </div>

              {!hasInsightGroupOptions ? (
                <Paragraph aria-live="polite">
                  Kunne ikke hente brukergrupper og formål for bestilling.
                </Paragraph>
              ) : null}

              <div className={styles.buttonContainer}>
                <Button type="submit" variant="primary" disabled={!canOrder}>
                  {!isOrdering && <DownloadIcon aria-hidden />}
                  {isOrdering ? "Bestiller..." : "Last ned produkter"}
                </Button>
                <Button
                  type="button"
                  data-color="danger"
                  variant="secondary"
                  onClick={() => {
                    clearDownloads();
                    setSelections({});
                  }}
                  disabled={isOrdering || selectedDownloadUuids.length === 0}
                >
                  <TrashIcon aria-hidden />
                  Fjern alt fra nedlasting
                </Button>
              </div>
            </form>

            {orderError ? (
              <Paragraph aria-live="polite">{orderError}</Paragraph>
            ) : null}
            {orderResult ? (
              <div className={styles.resultList}>
                {orderResult.orders.map((order, orderIndex) =>
                  order.status === "failed" ? (
                    <Paragraph
                      key={`failed-${order.metadataUuids.join("-")}`}
                      aria-live="polite"
                    >
                      Kunne ikke bestille{" "}
                      {order.metadataUuids
                        .map(
                          (uuid) =>
                            cards.find((card) => card.uuid === uuid)?.title ??
                            uuid,
                        )
                        .join(", ")}
                      : {order.message ?? "Ukjent feil"}. Du kan prøve på nytt.
                    </Paragraph>
                  ) : (
                    order.files.map((file, fileIndex) => (
                      <Paragraph
                        key={`${file.metadataUuid}-${orderIndex}-${fileIndex}`}
                      >
                        {file.status === "ReadyForDownload" &&
                        file.downloadUrl ? (
                          <a href={file.downloadUrl}>
                            Last ned {file.name ?? file.metadataName}
                          </a>
                        ) : (
                          <>
                            {file.name ?? file.metadataName} er under
                            behandling. Du får beskjed når den er klar.
                          </>
                        )}
                      </Paragraph>
                    ))
                  ),
                )}
              </div>
            ) : null}
          </section>
        </section>
      ) : null}
    </>
  );
}
