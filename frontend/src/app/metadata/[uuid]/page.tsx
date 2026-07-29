import { getFairStatus, getMetadata } from "@/app/api";
import { getUniqueItemsFromListByKey } from "@/app/metadata/[uuid]/_utils/utils";
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
  const [metadata, fairStatus] = await Promise.all([
    getMetadata(uuid),
    getFairStatus(uuid),
  ]);

  return (
    <div className={styles.content}>
      <DatasetHeader
        title={metadata.title}
        organization={metadata.organization}
        isOpen={metadata.accessIsOpenData}
      />
      <div className={styles.metaRow}>
        <DatasetThumbnail thumbnailUrl={metadata.thumbnailUrl} />
        <DatasetMeta
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
      <DatasetActions
        downloadUrl={d.DownloadUrl}
        coverageUrl={d.CoverageUrl}
        metadataXmlUrl={d.MetadataXmlUrl}
        editUrl={d.MetadataEditUrl}
      />
      <DatasetTabs
        abstract={metadata.abstractText ?? ""}
        specificUsage={metadata.specificUsage ?? ""}
        purpose={metadata.purpose ?? ""}
        processHistory={metadata.processHistory}
        // securityConstraints finnes ikke i LegalConstraints
        // bruk mock
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
    </div>
  );
}
