"use client";

import { Details, Heading, Tabs } from "@kv-designsystem/react";
import type { MouseEvent } from "react";
import { FairSection } from "@/app/metadata/[uuid]/_components/FairSection";
import { LinkedDistributionsSection } from "@/app/metadata/[uuid]/_components/LinkedDistributionsSection";
import { ProductDocumentation } from "@/app/metadata/[uuid]/_components/ProductDocumentation";
import {
  getProductTypeDefiniteString,
  getProductTypeString,
} from "@/lib/productType";
import type {
  LinkedDistributions,
  ProductFairStatus,
} from "@/lib/schemas/product";
import type { ProduktarkItem } from "@/lib/schemas/produktark";
import type { TegnereglerItem } from "@/lib/schemas/tegneregler";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ProductTabs.module.css";

export function ProductTabs({
  hierarchyLevel,
  abstract,
  linkedDistributions,
  fairStatus,
  tegneregler,
  produktark,
  productSpecificationUrl,
  distributionDetails,
  infoDetails,
}: {
  hierarchyLevel: string | null;
  abstract: string | null;
  linkedDistributions: LinkedDistributions;
  fairStatus: ProductFairStatus | null;
  tegneregler: TegnereglerItem | null;
  produktark: ProduktarkItem | null;
  productSpecificationUrl: string | null;
  distributionDetails: DetailItem[];
  infoDetails: DetailItem[];
}) {
  const productType = getProductTypeString(hierarchyLevel).toLowerCase();
  const productTypeDefinite = getProductTypeDefiniteString(hierarchyLevel);

  const hasDocumentation = Boolean(
    tegneregler?.documentreference ||
      produktark?.documentreference ||
      productSpecificationUrl,
  );

  const tabs = [
    { value: "distribution", label: `Distribusjoner for ${productType}` },
    { value: "info", label: `Informasjon om ${productType}` },
    ...(hasDocumentation
      ? [{ value: "documentation", label: "Dokumentasjon" }]
      : []),
    ...(fairStatus
      ? [{ value: "quality", label: "Metadatakvalitet (FAIR)" }]
      : []),
  ];
  return (
    <div data-color="info">
      <Tabs defaultValue="distribution" className={styles.tabs}>
        <Tabs.List>
          {tabs.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              onClick={() =>
                trackClick(`${t.value}-tab`, LOCATIONS.MetadataPageTabs)
              }
            >
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="distribution" className={styles.panel}>
          <Heading data-size="xs">Tilganger til {productType}</Heading>
          <div className={styles.accordionGroup} data-color="neutral">
            <DetailAccordion items={distributionDetails} />
          </div>
          <LinkedDistributionsSection
            linkedDistributions={linkedDistributions}
          />
        </Tabs.Panel>
        <Tabs.Panel value="info" className={styles.panel}>
          <div className={styles.headingGroup}>
            <Heading data-size="xs">Om {productTypeDefinite}</Heading>
            <p className={styles.abstract}>{abstract ?? "-"}</p>
          </div>
          <div className={styles.accordionGroup} data-color="neutral">
            <DetailAccordion items={infoDetails} />
          </div>
        </Tabs.Panel>
        {hasDocumentation && (
          <Tabs.Panel value="documentation" className={styles.panel}>
            <ProductDocumentation
              tegneregler={tegneregler}
              produktark={produktark}
              productSpecificationUrl={productSpecificationUrl}
            />
          </Tabs.Panel>
        )}
        {fairStatus && (
          <Tabs.Panel value="quality" className={styles.panel}>
            <FairSection fairStatus={fairStatus} />
          </Tabs.Panel>
        )}
      </Tabs>
    </div>
  );
}

export type DetailItem = {
  actionButton?: React.ReactNode | null;
  title: string;
  content: React.ReactNode;
};

function DetailAccordion({ items }: { items: DetailItem[] }) {
  const onAccordionClick = (
    event: MouseEvent<HTMLElement>,
    accordionTitle: string,
  ) => {
    const detailsElement = event.currentTarget.closest("details");

    trackClick("toggle-accordion", LOCATIONS.MetadataPageTabs, {
      accordionTitle,
      isExpanded: !detailsElement?.open,
    });
  };

  return (
    <>
      {items.map((item, i) => (
        <Details key={`${i}-${item.title}`}>
          <Details.Summary
            onClick={(event) => onAccordionClick(event, item.title)}
          >
            <div className={styles.accordionSummary}>
              {item.title} {item.actionButton}
            </div>
          </Details.Summary>
          <Details.Content>{item.content}</Details.Content>
        </Details>
      ))}
    </>
  );
}
