import {
  getFairStatus,
  getMetadataInfo,
  getMetadataSummary,
  getProductAlerts,
} from "@/app/api";
import ProductAlert from "@/app/metadata/[uuid]/_components/ProductAlert";
import {
  getRelevantAlerts,
  getUniqueItemsFromListByKey,
} from "@/app/metadata/[uuid]/_utils/utils";
import getData from "../../../mocks/getData.json";
import { DatasetActions } from "./_components/DatasetActions";
import { DatasetHeader } from "./_components/DatasetHeader";
import { DatasetMeta } from "./_components/DatasetMeta";
import { DatasetTabs } from "./_components/DatasetTabs";
import { DatasetThumbnail } from "./_components/DatasetThumbnail";
import styles from "./page.module.css";

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const d = getData;

  const { uuid } = await params;
  const [metadataSummary, metadataInfo, fairStatus] = await Promise.all([
    getMetadataSummary(uuid),
    getMetadataInfo(uuid),
    getFairStatus(uuid),
  ]);
  const alerts = await getProductAlerts(uuid);
  const relevantAlerts = getRelevantAlerts(alerts);

  return (
    <div className={styles.content}>
      <DatasetHeader
        title={metadataSummary.title}
        organization={metadataSummary.organization}
        isOpen={metadataSummary.accessIsOpenData}
      />
      {relevantAlerts.map((alert, index) => (
        <ProductAlert
          key={`${alert.alertType ?? "alert"}-${index}`}
          alert={alert}
        />
      ))}
      <div className={styles.metaRow}>
        <DatasetThumbnail thumbnailUrl={metadataSummary.thumbnailUrl} />
        <DatasetMeta
          // TODO: oversettes når i18n er på plass (SpatialScope kommer som engelsk fra getData)
          spatialScope={metadataSummary.spatialScope}
          representation={metadataSummary.spatialRepresentation}
          maintenanceFrequency={metadataSummary.maintenanceFrequency}
          resolutionScale={metadataSummary.resolutionScale}
          dateUpdated={metadataSummary.dateUpdated}
          themes={getUniqueItemsFromListByKey(
            [
              ...metadataSummary.nationalKeywords,
              ...metadataSummary.keywordsTheme,
            ],
            "keywordValue",
          )}
          formats={getUniqueItemsFromListByKey(
            metadataSummary.distributionFormats,
            "name",
          )}
          fairStatusPercent={fairStatus?.totalPercent ?? null}
        />
      </div>
      <DatasetActions
        downloadUrl={d.DownloadUrl}
        coverageUrl={d.CoverageUrl}
        metadataXmlUrl={d.MetadataXmlUrl}
        editUrl={metadataSummary.metadataEditUrl}
      />
      <DatasetTabs
        abstract={metadataInfo.abstractText ?? ""}
        specificUsage={metadataInfo.specificUsage ?? ""}
        purpose={metadataInfo.purpose ?? ""}
        processHistory={metadataInfo.processHistory}
        // securityConstraints finnes ikke i LegalConstraints
        // bruk mock
        constraints={{
          ...metadataInfo.constraints,
          SecurityConstraints: metadataInfo.securityClassification ?? "-",
        }}
        referenceSystems={d.ReferenceSystems}
        distributionGroups={d.DistributionFormatsGrouped}
        dateUpdated={metadataSummary.dateUpdated ?? ""}
        maintenanceFrequency={metadataSummary.maintenanceFrequency ?? ""}
        fairStatus={fairStatus}
      />
    </div>
  );
}
