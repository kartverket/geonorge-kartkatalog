import { getFairStatus, getMetadataInfo, getMetadataSummary } from "@/app/api";
import { getUniqueItemsFromListByKey } from "@/app/metadata/[uuid]/_utils/utils";
import getData from "../../../mocks/getData.json";
import { ProductActions } from "./_components/ProductActions";
import { ProductHeader } from "./_components/ProductHeader";
import { ProductMeta } from "./_components/ProductMeta";
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

  return (
    <div className={styles.content}>
      <ProductHeader
        title={metadataSummary.title}
        organization={metadataSummary.organization}
        isOpen={metadataSummary.accessIsOpenData}
      />
      <div className={styles.metaRow}>
        <DatasetThumbnail thumbnailUrl={metadataSummary.thumbnailUrl} />
        <ProductMeta
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
      <ProductActions
        downloadUrl={d.DownloadUrl}
        coverageUrl={d.CoverageUrl}
        metadataXmlUrl={d.MetadataXmlUrl}
        editUrl={d.MetadataEditUrl}
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
