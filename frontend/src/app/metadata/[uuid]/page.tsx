import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getLinkedDistributions,
  getMetadata,
  getProductAlerts,
} from "@/app/api";
import { ContactInfoCard } from "@/app/metadata/[uuid]/_components/ContactInfoCard";
import ProductAlert from "@/app/metadata/[uuid]/_components/ProductAlert";
import { ProductTabsSection } from "@/app/metadata/[uuid]/_components/ProductTabsSection";
import {
  getRelevantAlerts,
  getUniqueItemsFromListByKey,
  unwrapSettled,
} from "@/app/metadata/[uuid]/_utils/utils";
import type { LinkedDistributions } from "@/lib/schemas/product";
import { ProductActions } from "./_components/ProductActions";
import { ProductHeader } from "./_components/ProductHeader";
import { ProductMeta } from "./_components/ProductMeta";
import { ProductThumbnail } from "./_components/ProductThumbnail";
import styles from "./page.module.css";

// TODO: kunne fallbacken vært null i stedet for et tomt linked distribution-element?
const EMPTY_LINKED_DISTRIBUTIONS: LinkedDistributions = {
  applications: [],
  viewServices: [],
  downloadServices: [],
  seriesMembers: [],
  parentSeries: [],
  relatedDatasets: [],
  serviceLayers: [],
  parentService: [],
};

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
  const metadata = await getMetadata(uuid);
  const [alertsResult, linkedDistributionsResult] = await Promise.allSettled([
    getProductAlerts(uuid),
    getLinkedDistributions(uuid),
  ]);

  const alerts = unwrapSettled(alertsResult, "Kunne ikke laste varsler", null);

  const linkedDistributions: LinkedDistributions = unwrapSettled(
    linkedDistributionsResult,
    "Kunne ikke laste koblede distribusjoner",
    EMPTY_LINKED_DISTRIBUTIONS,
  );
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
          dateUpdated={null}
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
      <ProductActions
        uuid={uuid}
        metadata={metadata}
        linkedDistributions={linkedDistributions}
      />
      <Suspense>
        <ProductTabsSection
          uuid={uuid}
          metadata={metadata}
          linkedDistributions={linkedDistributions}
        />
      </Suspense>
      <ContactInfoCard
        contactMetadata={metadata.contactMetadata}
        contactOwner={metadata.contactOwner}
        contactPublisher={metadata.contactPublisher}
      />
    </div>
  );
}
