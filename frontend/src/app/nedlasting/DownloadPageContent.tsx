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
import { type SubmitEventHandler, useCallback, useState } from "react";
import { clearCart } from "@/app/_components/addToCart/cartStorage";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import {
  createDownloadOrderItem,
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  getMissingDownloadSelectionFields,
} from "@/app/nedlasting/downloadUtils";
import type { DownloadInsightGroups } from "@/lib/schemas/download";
import { DownloadCartList } from "./DownloadCartList";
import styles from "./DownloadPageContent.module.css";
import { useDownloadCartCards } from "./useDownloadCartCards";
import { useDownloadOptionsForCards } from "./useDownloadOptionsForCards";
import { useDownloadOrder } from "./useDownloadOrder";

type DownloadPageContentProps = {
  insightGroups: DownloadInsightGroups;
};

export function DownloadPageContent({
  insightGroups,
}: DownloadPageContentProps) {
  const orderItems = useOrderItems();
  const { cards, isLoading, hasLoadError } = useDownloadCartCards(orderItems);
  const cardUuids = cards.map((card) => card.uuid);
  const optionsByUuid = useDownloadOptionsForCards(cardUuids);
  const { isOrdering, orderError, orderResult, submitOrder } =
    useDownloadOrder();

  const [selections, setSelections] = useState<
    Record<string, DownloadSelection>
  >({});
  const [email, setEmail] = useState("");
  const [usageGroup, setUsageGroup] = useState("");
  const [usagePurpose, setUsagePurpose] = useState("");

  function handleSelectionChange(uuid: string, selection: DownloadSelection) {
    setSelections((current) => ({ ...current, [uuid]: selection }));
  }

  function applyToAllProducts(
    update: (selection: DownloadSelection) => DownloadSelection,
  ) {
    setSelections((current) => {
      const next = { ...current };
      for (const card of cards) {
        next[card.uuid] = update(next[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION);
      }
      return next;
    });
  }

  const downloadableProducts = cards.flatMap((card) => {
    const selection = selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
    const options = optionsByUuid[card.uuid]?.options ?? null;
    const item = createDownloadOrderItem(card.uuid, options, selection);

    return item ? [item] : [];
  });

  const productsWithMissingFields = cards.flatMap((card) => {
    const selection = selections[card.uuid] ?? EMPTY_DOWNLOAD_SELECTION;
    const missingFields = getMissingDownloadSelectionFields(selection);

    return missingFields.length > 0 ? [{ ...card, missingFields }] : [];
  });

  const canOrder =
    cards.length === orderItems.length &&
    downloadableProducts.length === cards.length &&
    email.trim() !== "" &&
    usageGroup !== "" &&
    usagePurpose !== "" &&
    !isOrdering &&
    !orderResult;

  const hasInsightGroupOptions =
    insightGroups.brukergrupper.length > 0 && insightGroups.formal.length > 0;

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      if (!canOrder) {
        return;
      }

      void submitOrder({
        email: email.trim(),
        usageGroup,
        items: downloadableProducts.map((item) => ({
          ...item,
          usagePurpose: [usagePurpose],
        })),
      });
    },
    [
      canOrder,
      email,
      downloadableProducts,
      submitOrder,
      usageGroup,
      usagePurpose,
    ],
  );

  return (
    <>
      <DownloadCartList
        orderItemsCount={orderItems.length}
        cards={cards}
        isLoading={isLoading}
        hasLoadError={hasLoadError}
        optionsByUuid={optionsByUuid}
        selections={selections}
        productsWithMissingFields={productsWithMissingFields}
        onSelectionChange={handleSelectionChange}
        onApplyToAll={applyToAllProducts}
      />
      {orderItems.length > 0 ? (
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
                    disabled={!hasInsightGroupOptions || isOrdering}
                    required
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
                  <Select
                    value={usagePurpose}
                    onChange={(event) => setUsagePurpose(event.target.value)}
                    disabled={!hasInsightGroupOptions || isOrdering}
                    required
                  >
                    <Select.Option value="">Velg formål</Select.Option>
                    {insightGroups.formal.map((purpose) => (
                      <Select.Option key={purpose} value={purpose}>
                        {purpose}
                      </Select.Option>
                    ))}
                  </Select>
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
                  onClick={clearCart}
                  disabled={isOrdering || orderItems.length === 0}
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
                {orderResult.orders
                  .flatMap((order) => order.files)
                  .map((file, index) => (
                    <Paragraph key={`${file.metadataUuid}-${index}`}>
                      {file.status === "ReadyForDownload" &&
                      file.downloadUrl ? (
                        <a href={file.downloadUrl}>
                          Last ned {file.name ?? file.metadataName}
                        </a>
                      ) : (
                        <>
                          {file.name ?? file.metadataName} er under behandling.
                          Du får beskjed når den er klar.
                        </>
                      )}
                    </Paragraph>
                  ))}
              </div>
            ) : null}
          </section>
        </section>
      ) : null}
    </>
  );
}
