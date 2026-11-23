"use client";

import { Tabs } from "@kv-designsystem/react";
import type { ReactNode } from "react";
import { FairTab } from "@/app/metadata/[uuid]/_components/FairTab";
import { ProductDocumentationTab } from "@/app/metadata/[uuid]/_components/ProductDocumentationTab";
import { getProductTypeDefiniteString } from "@/lib/productType";
import type { ProductFairStatus } from "@/lib/schemas/product";
import type { ProduktarkItem } from "@/lib/schemas/produktark";
import type { ProduktspesifikasjonItem } from "@/lib/schemas/produktspesifikasjon";
import type { TegnereglerItem } from "@/lib/schemas/tegneregler";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ProductTabs.module.css";

export function ProductTabs({
  hierarchyLevel,
  distributionContent,
  infoContent,
  fairStatus,
  tegneregler,
  produktark,
  produktspesifikasjon,
}: {
  hierarchyLevel: string | null;
  distributionContent: ReactNode;
  infoContent: ReactNode;
  fairStatus: ProductFairStatus | null;
  tegneregler: TegnereglerItem | null;
  produktark: ProduktarkItem | null;
  produktspesifikasjon: ProduktspesifikasjonItem | null;
}) {
  const productTypeDefinite = getProductTypeDefiniteString(hierarchyLevel);

  const hasDocumentation = Boolean(
    tegneregler?.documentreference ||
      tegneregler?.id ||
      tegneregler?.cartographyFile ||
      produktark?.documentreference ||
      produktark?.id ||
      produktspesifikasjon?.documentreference ||
      produktspesifikasjon?.applicationSchema ||
      produktspesifikasjon?.gmlApplicationSchema ||
      produktspesifikasjon?.id,
  );

  const tabs = [
    {
      value: "distribution",
      label: `Distribusjoner for ${productTypeDefinite}`,
    },
    { value: "info", label: `Informasjon om ${productTypeDefinite}` },
    ...(hasDocumentation
      ? [{ value: "documentation", label: "Dokumentasjon" }]
      : []),
    ...(fairStatus
      ? [{ value: "quality", label: "Metadatakvalitet (FAIR)" }]
      : []),
  ];
  return (
    <div>
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
          {distributionContent}
        </Tabs.Panel>
        <Tabs.Panel value="info" className={styles.panel}>
          {infoContent}
        </Tabs.Panel>
        {hasDocumentation && (
          <Tabs.Panel value="documentation" className={styles.panel}>
            <ProductDocumentationTab
              tegneregler={tegneregler}
              produktark={produktark}
              produktspesifikasjon={produktspesifikasjon}
            />
          </Tabs.Panel>
        )}
        {fairStatus && (
          <Tabs.Panel value="quality" className={styles.panel}>
            <FairTab fairStatus={fairStatus} />
          </Tabs.Panel>
        )}
      </Tabs>
    </div>
  );
}
