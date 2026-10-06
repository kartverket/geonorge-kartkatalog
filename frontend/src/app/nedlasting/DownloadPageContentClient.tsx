"use client";

import {
  Button,
  Field,
  Heading,
  Label,
  Paragraph,
  Tag,
  ValidationMessage,
} from "@kv-designsystem/react";
import { ArrowRightIcon, TrashIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import { type SubmitEventHandler, useEffect, useState } from "react";
import {
  clearDownloads,
  removeItemsFromDownloads,
} from "@/app/_components/addToDownloads/downloadStorage";
import { useSelectedDownloadUuids } from "@/app/_components/addToDownloads/useDownloads";
import {
  createDownloadOrderItems,
  type DownloadAreaBlock,
  type DownloadCard,
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  filterAreaBlockForProduct,
  getMissingDownloadSelectionFields,
} from "@/app/nedlasting/downloadUtils";
import { MultiSuggestion } from "@/app/nedlasting/MultiSuggestion";
import type { DownloadInsightGroups } from "@/lib/schemas/download";
import { DownloadOrderSummary } from "./DownloadOrderSummary";
import styles from "./DownloadPageContent.module.css";
import { DownloadSelectionList } from "./DownloadSelectionList";
import { type DownloadStep, DownloadStepper } from "./DownloadStepper";
import { SingleSuggestion } from "./SingleSuggestion";
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
  const [usageGroup, setUsageGroup] = useState("");
  const [usagePurpose, setUsagePurpose] = useState<string[]>([]);
  const [step, setStep] = useState<DownloadStep>("bestilling");
  const [orderedCards, setOrderedCards] = useState<DownloadCard[]>([]);

  function handleSelectionChange(uuid: string, selection: DownloadSelection) {
    setSelections((current) => ({ ...current, [uuid]: selection }));
  }

  function applyToAllProducts(bulkBlock: DownloadAreaBlock) {
    setSelections((current) => {
      const next = { ...current };
      for (const card of cards) {
        const options = optionsByUuid[card.uuid]?.options ?? null;
        const existing = current[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
        const filteredFirstBlock = filterAreaBlockForProduct(
          options,
          bulkBlock,
        );
        next[card.uuid] = {
          areaBlocks: [filteredFirstBlock, ...existing.areaBlocks.slice(1)],
        };
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
    return createDownloadOrderItems(
      card.uuid,
      card.distributionUrl,
      options,
      selection,
    );
  });

  const productsWithMissingFields = cards.flatMap((card) => {
    const selection = selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
    const missingFields = getMissingDownloadSelectionFields(selection);

    return missingFields.length > 0 ? [{ ...card, missingFields }] : [];
  });

  const canOrder =
    cards.length > 0 &&
    cards.length === selectedDownloadUuids.length &&
    productsWithMissingFields.length === 0 &&
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
      usageGroup,
      items: downloadableProducts.map((item) => ({
        ...item,
        usagePurpose,
      })),
    }).then((result) => {
      if (!result) return;
      setStep("last-ned");
      setOrderedCards(cards);
    });
  };

  function handleProductDownloaded(uuid: string) {
    const card = orderedCards.find((c) => c.uuid === uuid);
    if (!card) return;

    removeItemsFromDownloads([
      {
        accessType: card.accessState,
        distributionUrl: card.distributionUrl,
        name: card.title,
        organizationName: card.organization,
        uuid: card.uuid,
      },
    ]);

    setSelections((current) => {
      const next: Record<string, DownloadSelection> = {};
      for (const key of Object.keys(current)) {
        if (key !== uuid) next[key] = current[key];
      }
      return next;
    });
  }

  return (
    <>
      <Heading data-size={"lg"} level={1}>
        Filnedlastning - {step === "bestilling" ? "Bestilling" : "Oppsummering"}
      </Heading>
      <DownloadStepper step={step} />

      {step === "bestilling" ? (
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
          {selectedDownloadUuids.length > 0 ? (
            <section className={styles.orderSectionWrapper}>
              <section className={styles.orderSection}>
                <Heading level={2} data-size={"sm"}>
                  Vennligst fyll ut
                </Heading>
                <div className={styles.infoRow}>
                  <ValidationMessage data-color="info">
                    Opplysningene brukes kun til å gi oss oversikt over bruken
                    av produktene, og knyttes ikke til deg som person.
                  </ValidationMessage>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className={styles.userInputs}>
                    <Field>
                      <Label>
                        Brukergruppe{" "}
                        <Tag data-color="warning">Må fylles ut</Tag>
                      </Label>
                      <SingleSuggestion
                        selectedValue={usageGroup || null}
                        onChangeAction={(value) => setUsageGroup(value ?? "")}
                        options={insightGroups.brukergrupper.map((group) => ({
                          label: group,
                          value: group,
                        }))}
                        placeholder="Velg brukergruppe"
                        isOrdering={isOrdering}
                      />
                    </Field>
                    <Field>
                      <Label>
                        Formål <Tag data-color="warning">Må fylles ut</Tag>
                      </Label>
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
                  </div>

                  {!hasInsightGroupOptions ? (
                    <Paragraph aria-live="polite">
                      Kunne ikke hente brukergrupper og formål for bestilling.
                    </Paragraph>
                  ) : null}

                  <div className={styles.buttonContainer}>
                    <div className={styles.buttonContainer}>
                      <Button
                        type="button"
                        data-color="danger"
                        variant="secondary"
                        onClick={() => {
                          clearDownloads();
                          setSelections({});
                          setStep("bestilling");
                        }}
                        disabled={
                          isOrdering || selectedDownloadUuids.length === 0
                        }
                      >
                        <TrashIcon aria-hidden />
                        Fjern alle nedlastinger
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!canOrder}
                      >
                        {!isOrdering && <ArrowRightIcon aria-hidden />}
                        {isOrdering
                          ? "Bestiller..."
                          : "Gå videre til oppsummering"}
                      </Button>
                    </div>
                  </div>
                </form>

                {orderError ? (
                  <Paragraph aria-live="polite">{orderError}</Paragraph>
                ) : null}
              </section>
            </section>
          ) : null}
        </>
      ) : (
        <section className={styles.orderSectionWrapper}>
          <section className={styles.orderSection}>
            {orderResult ? (
              <>
                {orderResult.orders
                  .filter((order) => order.status === "failed")
                  .map((order) => (
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
                  ))}
                <DownloadOrderSummary
                  orderResult={orderResult}
                  cards={orderedCards}
                  onProductDownloaded={handleProductDownloaded}
                />
              </>
            ) : null}
            <div className={styles.buttonContainer}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep("bestilling")}
              >
                ← Gå tilbake til bestilling
              </Button>
              <Button type="button" variant="secondary" asChild>
                <Link href="/">Gå til Kartkatalogen</Link>
              </Button>
            </div>
          </section>
        </section>
      )}
    </>
  );
}
