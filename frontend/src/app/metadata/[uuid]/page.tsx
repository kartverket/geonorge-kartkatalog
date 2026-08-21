import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getFairStatus,
  getLinkedDistributions,
  getMetadata,
  getProductAlerts,
  getProduktark,
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
  const [metadata, alerts, linkedDistributionsResult] = await Promise.all([
    getMetadata(uuid),
    getProductAlerts(uuid).catch((error) => {
      console.error("Kunne ikke laste varsler", error);
      return null;
    }),
    getLinkedDistributions(uuid).catch((error) => {
      console.error("Kunne ikke laste koblede distribusjoner", error);
      return null;
    }),
  ]);
  const relevantAlerts = getRelevantAlerts(alerts);
  const linkedDistributions = linkedDistributionsResult ?? {
    applications: [],
    viewServices: [],
    downloadServices: [],
    seriesMembers: [],
    parentSeries: [],
    relatedDatasets: [],
    serviceLayers: [],
    parentService: [],
  };

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
      <ProductActions
        uuid={uuid}
        metadata={metadata}
        linkedDistributions={linkedDistributions}
      />
      <Suspense>
        <ProductTabsSection
          uuid={uuid}
          metadata={metadata}
          initialLinkedDistributions={linkedDistributions}
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

async function ProductTabsSection({
  initialLinkedDistributions,
  uuid,
  metadata,
}: {
  initialLinkedDistributions: Awaited<
    ReturnType<typeof getLinkedDistributions>
  >;
  uuid: string;
  metadata: Awaited<ReturnType<typeof getMetadata>>;
}) {
  const [
    fairStatusResult,
    tegnereglerResult,
    produktarkResult,
  ] = await Promise.allSettled([
    getFairStatus(uuid),
    getTegneregler(uuid),
    getProduktark(uuid),
  ]);

  if (fairStatusResult.status === "rejected") {
    console.error("Kunne ikke laste FAIR-status", fairStatusResult.reason);
  }
  if (tegnereglerResult.status === "rejected") {
    console.error("Kunne ikke laste tegneregler", tegnereglerResult.reason);
  }
  if (produktarkResult.status === "rejected") {
    console.error("Kunne ikke laste produktark", produktarkResult.reason);
  }

  const fairStatus =
    fairStatusResult.status === "fulfilled" ? fairStatusResult.value : null;
  const tegneregler =
    tegnereglerResult.status === "fulfilled" ? tegnereglerResult.value : null;
  const produktark =
    produktarkResult.status === "fulfilled" ? produktarkResult.value : null;

  return (
    <ProductTabs
      hierarchyLevel={metadata.hierarchyLevel}
      abstract={metadata.abstractText}
      specificUsage={metadata.specificUsage}
      purpose={metadata.purpose}
      processHistory={metadata.processHistory}
      supplementalDescription={metadata.supplementalDescription}
      helpUrl={metadata.helpUrl}
      constraints={{
        ...metadata.constraints,
        securityConstraints: metadata.securityClassification,
      }}
      referenceSystems={metadata.referenceSystems}
      distributionGroups={metadata.distributionGroups}
      linkedDistributions={initialLinkedDistributions}
      dateUpdated={metadata.dateUpdated}
      maintenanceFrequency={metadata.maintenanceFrequency}
      fairStatus={fairStatus}
      tegneregler={tegneregler}
      produktark={produktark}
    />
  );
}
