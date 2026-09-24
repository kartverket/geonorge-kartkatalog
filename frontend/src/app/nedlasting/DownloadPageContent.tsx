"use client";

import {
  Button, Field, Heading,
  Input,
  Label,
  Paragraph,
  Select,
} from "@kv-designsystem/react";
import { type SubmitEventHandler, useCallback, useState } from "react";
import { useOrderItems } from "@/app/_components/addToCart/useCart";
import {
  createDownloadOrderItem,
  type DownloadSelection,
  getMissingDownloadSelectionFields,
  type MissingDownloadSelectionField,
} from "@/app/nedlasting/downloadUtils";
import { clearCart } from "@/app/_components/addToCart/cartStorage";
import { MissingInputSummary } from "@/app/nedlasting/MissingInputSummary";
import type {
  DownloadInsightGroups,
  DownloadOptions,
} from "@/lib/schemas/download";
import { DownloadCartList } from "./DownloadCartList";
import styles from "./DownloadPageContent.module.css";
import { useDownloadCartCards } from "./useDownloadCartCards";
import { useDownloadOrder } from "./useDownloadOrder";
import {DownloadIcon, TrashFillIcon, TrashIcon} from "@navikt/aksel-icons";

type DownloadPageContentProps = {
  insightGroups: DownloadInsightGroups;
};
type ProductSelection = {
  options: DownloadOptions | null;
  selection: DownloadSelection;
};

export function DownloadPageContent({
  insightGroups,
}: DownloadPageContentProps) {
  const orderItems = useOrderItems();
  const { cards, isLoading, hasLoadError } = useDownloadCartCards(orderItems);
  const { isOrdering, orderError, orderResult, submitOrder } =
    useDownloadOrder();

  const [selectionInputs, setSelectionInputs] = useState<
    Record<string, ProductSelection>
  >({});
  const [email, setEmail] = useState("");
  const [usageGroup, setUsageGroup] = useState("");
  const [usagePurpose, setUsagePurpose] = useState("");

  const handleSelectionChange = useCallback(
    (
      uuid: string,
      options: DownloadOptions | null,
      selection: DownloadSelection,
    ) => {
      setSelectionInputs((current) => ({
        ...current,
        [uuid]: { options, selection },
      }));
    },
    [],
  );

  const downloadableProducts = cards.flatMap((card) => {
    const productSelection = selectionInputs[card.uuid];

    if (!productSelection) return [];

    const item = createDownloadOrderItem(
      card.uuid,
      productSelection.options,
      productSelection.selection,
    );

    return item ? [item] : [];
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

  const productsWithMissingFields = cards.flatMap((card) => {
    const productSelection = selectionInputs[card.uuid];
    const missingFields: MissingDownloadSelectionField[] = productSelection
      ? getMissingDownloadSelectionFields(productSelection.selection)
      : ["area", "projection", "format"];

    return missingFields.length > 0 ? [{ ...card, missingFields }] : [];
  });

  return (
    <>
      <DownloadCartList
        orderItemsCount={orderItems.length}
        cards={cards}
        isLoading={isLoading}
        hasLoadError={hasLoadError}
        onSelectionChange={handleSelectionChange}
      />
      {productsWithMissingFields.length > 0 ? (
        <MissingInputSummary
          productsWithMissingFields={productsWithMissingFields}
        />
      ) : null}
      {orderItems.length > 0 ? (
        <section className={styles.orderSectionWrapper}>
        <section className={styles.orderSection}>
          <Heading level={2} data-size={"sm"}>Vennligst fyll ut</Heading>
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
              <Button type="submit" disabled={!canOrder}>
                {!isOrdering && <DownloadIcon aria-hidden/>}
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
                Fjern alt fra handlekurv
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
                    {file.status === "ReadyForDownload" && file.downloadUrl ? (
                      <a href={file.downloadUrl}>
                        Last ned {file.name ?? file.metadataName}
                      </a>
                    ) : (
                      <>
                        {file.name ?? file.metadataName} er under behandling. Du
                        får beskjed når den er klar.
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
