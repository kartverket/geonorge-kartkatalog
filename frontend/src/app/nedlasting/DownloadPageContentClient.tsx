"use client";

import {
  Alert,
  Button,
  Field,
  Heading,
  Input,
  Label,
  Paragraph,
  Tag,
  ValidationMessage,
} from "@kv-designsystem/react";
import { ArrowLeftIcon, ArrowRightIcon, TrashIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import { type SubmitEventHandler, useEffect, useRef, useState } from "react";
import {
  clearDownloads,
  removeItemsFromDownloads,
} from "@/app/_components/addToDownloads/downloadStorage";
import { useSelectedDownloadUuids } from "@/app/_components/addToDownloads/useDownloads";
import {
  appendBulkAreaBlocks,
  createDownloadOrderItems,
  type DownloadCard,
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  filterAreaBlockForProduct,
  getMissingDownloadSelectionFields,
} from "@/app/nedlasting/downloadUtils";
import { MultiSuggestion } from "@/app/nedlasting/MultiSuggestion";
import { useAuthInfo } from "@/components/AuthProvider";
import {
  type DownloadInsightGroups,
  DownloadOrderEmailSchema,
} from "@/lib/schemas/download";
import { LOCATIONS, trackEvent } from "@/posthog/posthog";
import { ConfirmDialog } from "./ConfirmDialog";
import { DownloadOrderSummary } from "./DownloadOrderSummary";
import styles from "./DownloadPageContent.module.css";
import { DownloadSelectionList } from "./DownloadSelectionList";
import { type DownloadStep, DownloadStepper } from "./DownloadStepper";
import { OverwriteConfirmDialog } from "./OverwriteConfirmDialog";
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
  const authState = useAuthInfo();
  const selectedDownloadUuids = useSelectedDownloadUuids();
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);
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
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<DownloadStep>("bestilling");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);

  // Bytte av steg er ikke en navigering, så nettleseren beholder scrollposisjonen.
  // Vi scroller til toppen og flytter fokus til overskriften, slik at det oppleves
  // som en ny side, også for skjermlesere.
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const [orderedCards, setOrderedCards] = useState<DownloadCard[]>([]);
  const [orderEmailProvided, setOrderEmailProvided] = useState(false);
  const [pendingBulkSelection, setPendingBulkSelection] =
    useState<DownloadSelection | null>(null);
  const [showRemoveAllConfirm, setShowRemoveAllConfirm] = useState(false);
  const [showStartNewOrderConfirm, setShowStartNewOrderConfirm] =
    useState(false);

  function handleSelectionChange(uuid: string, selection: DownloadSelection) {
    setSelections((current) => ({ ...current, [uuid]: selection }));
  }

  function applyBulkSelection(
    bulkSelection: DownloadSelection,
    mode: "overwrite" | "append",
  ) {
    setSelections((current) => {
      const next = { ...current };
      for (const card of cards) {
        const options = optionsByUuid[card.uuid]?.options ?? null;
        const filteredBlocks = bulkSelection.areaBlocks.map((block) =>
          filterAreaBlockForProduct(options, block),
        );
        const existing = current[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
        next[card.uuid] =
          mode === "overwrite"
            ? { areaBlocks: filteredBlocks }
            : {
                areaBlocks: appendBulkAreaBlocks(
                  existing.areaBlocks,
                  filteredBlocks,
                ),
              };
      }
      return next;
    });
  }

  function hasExistingManualSelections() {
    return cards.some((card) => {
      const existing = selections[card.uuid];
      return (
        existing?.areaBlocks.some(
          (block) => block.areaCode !== null || block.polygon !== null,
        ) ?? false
      );
    });
  }

  function handleApplyToAll(bulkSelection: DownloadSelection) {
    if (hasExistingManualSelections()) {
      setPendingBulkSelection(bulkSelection);
      return;
    }

    applyBulkSelection(bulkSelection, "overwrite");
  }

  function handleConfirmOverwrite() {
    if (pendingBulkSelection) {
      applyBulkSelection(pendingBulkSelection, "overwrite");
    }
    setPendingBulkSelection(null);
  }

  function handleAppendOverwrite() {
    if (pendingBulkSelection) {
      applyBulkSelection(pendingBulkSelection, "append");
    }
    setPendingBulkSelection(null);
  }

  function handleCancelOverwrite() {
    setPendingBulkSelection(null);
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

  const hasOnlyOpenDatasets = cards.every(
    (card) => card.accessState === "open",
  );

  const hasPolygonSelection = cards.some((card) => {
    const selection = selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
    return selection.areaBlocks.some((block) => block.polygon !== null);
  });

  const requiresEmail =
    hasPolygonSelection ||
    cards.some(
      (card) => optionsByUuid[card.uuid]?.options?.deliveryNotificationByEmail,
    );

  const isValidEmail = DownloadOrderEmailSchema.safeParse(email.trim()).success;

  const canOrder =
    cards.length > 0 &&
    cards.length === selectedDownloadUuids.length &&
    productsWithMissingFields.length === 0 &&
    usageGroup !== "" &&
    usagePurpose.length > 0 &&
    (!requiresEmail || isValidEmail) &&
    (authState.status === "anonymous" ||
      authState.status === "authenticated" ||
      (authState.status === "error" && hasOnlyOpenDatasets)) &&
    !isOrdering;

  const hasInsightGroupOptions =
    insightGroups.brukergrupper.length > 0 && insightGroups.formal.length > 0;

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!canOrder) {
      return;
    }

    void submitOrder(
      {
        email: requiresEmail && email.trim() ? email.trim() : undefined,
        usageGroup,
        items: downloadableProducts.map((item) => ({
          ...item,
          usagePurpose,
        })),
      },
      authState.status === "authenticated" ? authState.provider : null,
    ).then((result) => {
      if (!result) return;

      const files = result.orders.flatMap((order) =>
        order.status === "ordered" ? order.files : [],
      );
      const datasetCount = new Set(
        downloadableProducts.map((item) => item.uuid),
      ).size;

      trackEvent("download-order-completed", {
        location: LOCATIONS.DownloadPage,
        datasetCount,
        totalFileCount: files.length,
        readyFileCount: files.filter(
          (file) => file.status === "ReadyForDownload",
        ).length,
      });

      clearDownloads();
      setSelections({});
      setStep("last-ned");
      setOrderedCards(cards);
      setOrderEmailProvided(requiresEmail && Boolean(email.trim()));
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

  function handleStartNewOrder() {
    clearDownloads();
    setSelections({});
    setUsageGroup("");
    setUsagePurpose([]);
    setEmail("");
    setOrderEmailProvided(false);
    setStep("bestilling");
    setShowStartNewOrderConfirm(false);
  }
  const hasProcessingFiles = Boolean(
    orderResult?.orders.some(
      (order) =>
        order.status === "ordered" &&
        order.files.some(
          (file) =>
            file.status !== "ReadyForDownload" && file.status !== "Failed",
        ),
    ),
  );

  return (
    <>
      <Heading data-size={"lg"} level={1} ref={headingRef} tabIndex={-1}>
        Filnedlastning - {step === "bestilling" ? "Bestilling" : "Nedlasting"}
      </Heading>
      <DownloadStepper step={step} />
      <OverwriteConfirmDialog
        open={pendingBulkSelection !== null}
        onConfirmAction={handleConfirmOverwrite}
        onAppendAction={handleAppendOverwrite}
        onCancelAction={handleCancelOverwrite}
      />
      <ConfirmDialog
        open={showRemoveAllConfirm}
        heading="Er du sikker?"
        description="Dette fjerner alle datasett og valg fra nedlastingskurven. Dette kan ikke angres."
        confirmLabel="Ja, fjern alle"
        onConfirmAction={() => {
          clearDownloads();
          setSelections({});
          setStep("bestilling");
          setShowRemoveAllConfirm(false);
        }}
        onCancelAction={() => setShowRemoveAllConfirm(false)}
      />
      <ConfirmDialog
        open={showStartNewOrderConfirm}
        heading="Er du sikker?"
        description="Dette tømmer kurven og alle valgene dine, og du blir sendt til en tom bestillingsside. Dette kan ikke angres."
        confirmLabel="Ja, start ny bestilling"
        onConfirmAction={handleStartNewOrder}
        onCancelAction={() => setShowStartNewOrderConfirm(false)}
      />

      {step === "bestilling" ? (
        <>
          <DownloadSelectionList
            selectedDownloadCount={selectedDownloadUuids.length}
            hasHydrated={hasHydrated}
            cards={cards}
            isLoading={isLoading}
            hasLoadError={hasLoadError}
            optionsByUuid={optionsByUuid}
            selections={selections}
            productsWithMissingFields={productsWithMissingFields}
            onSelectionChange={handleSelectionChange}
            onApplyToAll={handleApplyToAll}
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
                      <Label className={styles.labelRow}>
                        Brukergruppe
                        <Tag
                          data-color="warning"
                          className={
                            usageGroup !== "" ? styles.hiddenTag : undefined
                          }
                        >
                          Må fylles ut
                        </Tag>
                      </Label>
                      <SingleSuggestion
                        selectedValue={usageGroup || null}
                        onChangeAction={(value) => setUsageGroup(value ?? "")}
                        options={[...insightGroups.brukergrupper]
                          .sort((a, b) => a.localeCompare(b, "nb"))
                          .map((group) => ({
                            label: group,
                            value: group,
                          }))}
                        placeholder="Velg brukergruppe"
                        isOrdering={isOrdering}
                      />
                    </Field>
                    <Field>
                      <Label className={styles.labelRow}>
                        Formål
                        <Tag
                          data-color="warning"
                          className={
                            usagePurpose.length > 0
                              ? styles.hiddenTag
                              : undefined
                          }
                        >
                          Må fylles ut
                        </Tag>
                      </Label>
                      <MultiSuggestion
                        selectedValues={usagePurpose}
                        onChangeAction={setUsagePurpose}
                        options={[...insightGroups.formal]
                          .sort((a, b) => a.localeCompare(b, "nb"))
                          .map((purpose) => ({
                            label: purpose,
                            value: purpose,
                          }))}
                        placeholder="Velg formål"
                        isOrdering={isOrdering}
                      />
                    </Field>
                  </div>

                  {requiresEmail ? (
                    <div className={styles.userInputs}>
                      <Field>
                        <Label className={styles.labelRow}>
                          E-post
                          <Tag
                            data-color="warning"
                            className={
                              isValidEmail ? styles.hiddenTag : undefined
                            }
                          >
                            Må fylles ut
                          </Tag>
                        </Label>
                        <Field.Description>
                          {cards.length > 1
                            ? "Du har valgt ett eller flere datasett som krever e-postadresse for å motta nedlastingslenke."
                            : "Du har valgt et datasett som krever e-postadresse for å motta nedlastingslenke."}
                        </Field.Description>
                        <Input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          disabled={isOrdering}
                          placeholder="din@epost.no"
                        />
                      </Field>
                      <div aria-hidden="true" />
                    </div>
                  ) : null}

                  {!hasInsightGroupOptions ? (
                    <Paragraph aria-live="polite">
                      Kunne ikke hente brukergrupper og formål for bestilling.
                    </Paragraph>
                  ) : null}

                  <div className={styles.buttonContainer}>
                    <Button
                      type="button"
                      variant="secondary"
                      className={styles.removeAllButton}
                      onClick={() => setShowRemoveAllConfirm(true)}
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
                        ? "Bestiller nedlasting..."
                        : "Bestill nedlasting"}
                    </Button>
                  </div>
                </form>

                {orderError ? (
                  <Paragraph aria-live="polite">{orderError}</Paragraph>
                ) : null}
                {authState.status === "error" ? (
                  <Paragraph aria-live="polite">
                    Kunne ikke bekrefte innloggingen. Prøv å laste siden på
                    nytt.
                  </Paragraph>
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
            {hasProcessingFiles && orderEmailProvided ? (
              <Alert data-color="info" className={styles.processingAlert}>
                Du vil få en e-post med nedlastingslenke når filene er klare.
                Det er trygt å lukke denne siden i mellomtiden.
              </Alert>
            ) : null}
            <div className={styles.finishButtonContainer}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowStartNewOrderConfirm(true)}
              >
                <ArrowLeftIcon aria-hidden />
                Opprett en ny bestilling
              </Button>
              <Button type="button" variant="primary" asChild>
                <Link href="/" className={styles.finishLink}>
                  Avslutt og gå til kartkatalogen
                </Link>
              </Button>
            </div>
          </section>
        </section>
      )}
    </>
  );
}
