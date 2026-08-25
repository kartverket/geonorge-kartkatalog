import type { Metadata } from "next";
import { Suspense } from "react";
import { getMetadata, getProductAlerts } from "@/app/api";
import { ContactInfoCard } from "@/app/metadata/[uuid]/_components/ContactInfoCard";
import ProductAlert from "@/app/metadata/[uuid]/_components/ProductAlert";
import { ProductTabsSection } from "@/app/metadata/[uuid]/_components/ProductTabsSection";
import {
  getRelevantAlerts,
  getUniqueItemsFromListByKey,
} from "@/app/metadata/[uuid]/_utils/utils";
import { ProductActions } from "./_components/ProductActions";
import { ProductHeader } from "./_components/ProductHeader";
import { ProductMeta } from "./_components/ProductMeta";
import { ProductThumbnail } from "./_components/ProductThumbnail";
import styles from "./page.module.css";

// Setter metadatatittel så det bla vises i faner
export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string }>;
}): Promise<Metadata> {
  const { uuid } = await params;
  const metadata = await getMetadata(uuid);
  const pageTitle = metadata?.title || "Kartkatalogen";
  return { title: pageTitle };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const [metadata, alerts] = await Promise.all([
    getMetadata(uuid),
    getProductAlerts(uuid).catch((error) => {
      console.error("Kunne ikke laste varsler", error);
      return null;
    }),
  ]);
  const relevantAlerts = getRelevantAlerts(alerts);

  return (
    <div className={styles.content}>
      <ProductHeader
        hierarchyLevel={metadata.hierarchyLevel}
        title={metadata.title}
        organization={metadata.organization}
        access={metadata.accessState}
      />
      {relevantAlerts.map((alert, index) => (
        <ProductAlert
          key={`${alert.alertType ?? "alert"}-${index}`}
          alert={alert}
        />
      ))}
      <div className={styles.metaRow}>
        <ProductThumbnail thumbnailUrl={metadata.thumbnailUrl} />
        <ProductMeta
          spatialScope={metadata.spatialScope}
          representation={metadata.spatialRepresentation}
          maintenanceFrequency={metadata.maintenanceFrequency}
          resolutionScale={metadata.resolutionScale}
          dateUpdated={metadata.dateUpdated}
          themes={getUniqueItemsFromListByKey(
            [...metadata.nationalKeywords, ...metadata.keywordsTheme],
            "keywordValue",
          )}
          formats={getUniqueItemsFromListByKey(
            metadata.distributionFormats,
            "name",
          )}
          fairStatusPercent={metadata.fairStatusPercentFromMetadata}
          relevantCategories={[
            ...(metadata.dokStatus ? [metadata.dokStatus] : []),
            ...metadata.nationalInitiatives,
            ...(metadata.isHighValueDataset ? ["High Value Dataset"] : []),
          ]}
        />
      </div>
      <ProductActions uuid={uuid} metadata={metadata} />
      <Suspense>
        <ProductTabsSection uuid={uuid} metadata={metadata} />
      </Suspense>
      <ContactInfoCard
        contactMetadata={metadata.contactMetadata}
        contactOwner={metadata.contactOwner}
        contactPublisher={metadata.contactPublisher}
      />
    </div>
  );
}
