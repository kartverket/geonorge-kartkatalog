import { Suspense } from "react";
import {
  getFairStatus,
  getLinkedDistributions,
  getMetadata,
  getProductAlerts,
  getTegneregler,
} from "@/app/api";
import { ContactInfoCard } from "@/app/metadata/[uuid]/_components/ContactInfoCard";
import ProductAlert from "@/app/metadata/[uuid]/_components/ProductAlert";
import {
  getRelevantAlerts,
  getUniqueItemsFromListByKey,
} from "@/app/metadata/[uuid]/_utils/utils";
import { ProductActions } from "./_components/ProductActions";
import { ProductHeader } from "./_components/ProductHeader";
import { ProductMeta } from "./_components/ProductMeta";
import { ProductTabs } from "./_components/ProductTabs";
import { ProductThumbnail } from "./_components/ProductThumbnail";
import styles from "./page.module.css";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const [metadata, alerts] = await Promise.all([
    getMetadata(uuid),
    getProductAlerts(uuid),
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
          relevantCategories={null} // TODO: GN-241 - Legg til relevantCategories når det er tilgjengelig i metadata
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

async function ProductTabsSection({
  uuid,
  metadata,
}: {
  uuid: string;
  metadata: Awaited<ReturnType<typeof getMetadata>>;
}) {
  const [fairStatus, tegneregler, linkedDistributions] = await Promise.all([
    getFairStatus(uuid),
    getTegneregler(uuid),
    getLinkedDistributions(uuid),
  ]);

  return (
    <ProductTabs
      hierarchyLevel={metadata.hierarchyLevel}
      abstract={metadata.abstractText}
      specificUsage={metadata.specificUsage}
      purpose={metadata.purpose}
      processHistory={metadata.processHistory}
      constraints={{
        ...metadata.constraints,
        securityConstraints: metadata.securityClassification,
      }}
      referenceSystems={metadata.referenceSystems}
      distributionGroups={metadata.distributionGroups}
      linkedDistributions={linkedDistributions}
      dateUpdated={metadata.dateUpdated}
      maintenanceFrequency={metadata.maintenanceFrequency}
      fairStatus={fairStatus}
      tegneregler={tegneregler}
      productSpecificationUrl={metadata.productSpecificationUrl}
    />
  );
}
