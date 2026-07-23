import { getMetadataSummary } from "@/app/api";
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
  const metadataSummary = await getMetadataSummary(uuid);

  return (
    <div className={styles.content}>
      <DatasetHeader
        title={metadataSummary.title}
        organization={metadataSummary.organization}
        isOpen={metadataSummary.accessIsOpenData}
      />
      <div className={styles.metaRow}>
        <DatasetThumbnail thumbnailUrl={metadataSummary.thumbnailUrl} />
        <DatasetMeta
          // TODO: oversettes når i18n er på plass (SpatialScope kommer som engelsk fra getData)
          spatialScope={metadataSummary.spatialScope}
          representation={metadataSummary.spatialRepresentation}
          maintenanceFrequency={metadataSummary.maintenanceFrequency}
          resolutionScale={metadataSummary.resolutionScale}
          dateUpdated={metadataSummary.dateUpdated}
          themes={[
            ...metadataSummary.keywordsTheme.map((k) => k.keywordValue),
            ...metadataSummary.nationalKeywords.map((k) => k.keywordValue),
          ].filter((item): item is string => !!item)}
          formats={[
            ...new Set(metadataSummary.distributionFormats.map((f) => f.name)),
          ].filter((item): item is string => !!item)}
        />
      </div>
      <DatasetActions
        downloadUrl={d.DownloadUrl}
        coverageUrl={d.CoverageUrl}
        metadataXmlUrl={d.MetadataXmlUrl}
        editUrl={d.MetadataEditUrl}
      />
      <DatasetTabs
        abstract={d.Abstract}
        purpose={d.Purpose}
        specificUsage={d.SpecificUsage}
        constraints={d.Constraints}
        representation={d.SpatialRepresentation}
        referenceSystems={d.ReferenceSystems}
        distributionGroups={d.DistributionFormatsGrouped}
        dateUpdated={d.DateUpdated}
        maintenanceFrequency={d.MaintenanceFrequency}
      />
    </div>
  );
}
