import { Suspense } from "react";
import { getFairStatus, getMetadata, getProductAlerts } from "@/app/api";
import ProductAlert from "@/app/metadata/[uuid]/_components/ProductAlert";
import {
  getRelevantAlerts,
  getUniqueItemsFromListByKey,
} from "@/app/metadata/[uuid]/_utils/utils";
import getData from "../../../mocks/getData.json";
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
  const d = getData;

  const { uuid } = await params;
  const metadata = await getMetadata(uuid);
  const alerts = await getProductAlerts(uuid);
  const relevantAlerts = getRelevantAlerts(alerts);

  return (
    <div className={styles.content}>
      <ProductHeader
        title={metadata.title}
        organization={metadata.organization}
        isOpen={metadata.accessIsOpenData}
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
          // TODO: oversettes når i18n er på plass (SpatialScope kommer som engelsk fra getData)
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
        />
      </div>
      <ProductActions
        downloadUrl={d.DownloadUrl}
        coverageUrl={d.CoverageUrl}
        metadataXmlUrl={d.MetadataXmlUrl}
        editUrl={d.MetadataEditUrl}
      />
      {/* trenger kanskje ikke vise noe tekst mens det laster?
       "Later mer informasjon" står enn så lenge*/}
      <Suspense fallback={<p>Laster mer informasjon...</p>}>
        <ProductTabsSection uuid={uuid} metadata={metadata} d={d} />
      </Suspense>
    </div>
  );
}

async function ProductTabsSection({
  uuid,
  metadata,
  d,
}: {
  uuid: string;
  metadata: Awaited<ReturnType<typeof getMetadata>>;
  d: typeof getData;
}) {
  const fairStatus = await getFairStatus(uuid);

  return (
    <ProductTabs
      abstract={metadata.abstractText ?? ""}
      specificUsage={metadata.specificUsage ?? ""}
      purpose={metadata.purpose ?? ""}
      processHistory={metadata.processHistory}
      constraints={{
        ...metadata.constraints,
        SecurityConstraints: metadata.securityClassification ?? "-",
      }}
      referenceSystems={d.ReferenceSystems}
      distributionGroups={d.DistributionFormatsGrouped}
      dateUpdated={metadata.dateUpdated ?? ""}
      maintenanceFrequency={metadata.maintenanceFrequency ?? ""}
      fairStatus={fairStatus}
    />
  );
}
