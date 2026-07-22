import getData from "../../../mocks/getData.json";
import { DatasetActions } from "./_components/DatasetActions";
import { DatasetHeader } from "./_components/DatasetHeader";
import { DatasetMeta } from "./_components/DatasetMeta";
import { DatasetTabs } from "./_components/DatasetTabs";
import { DatasetThumbnail } from "./_components/DatasetThumbnail";
import styles from "./page.module.css";

export default async function DatasetPage() {
  const d = getData;
  const thumb =
    d.Thumbnails.find((t) => t.Type === "medium")?.URL ?? d.Thumbnails[0]?.URL;
  return (
    <div className={styles.content}>
      <DatasetHeader
        title={d.Title}
        organization={d.Organization}
        isOpen={d.AccessIsOpendata}
      />
      <div className={styles.metaRow}>
        <DatasetThumbnail thumbnailUrl={thumb} />
        <DatasetMeta
          // TODO: oversettes når i18n er på plass (SpatialScope kommer som engelsk fra getData)
          spatialScope={d.SpatialScope}
          representation={d.SpatialRepresentation}
          maintenanceFrequency={d.MaintenanceFrequency}
          resolutionScale={d.ResolutionScale}
          dateUpdated={d.DateUpdated}
          themes={d.KeywordsTheme.map((k) => k.KeywordValue)}
          formats={[...new Set(d.DistributionFormats.map((f) => f.Name))]}
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
        dateCreated={d.DateCreated}
        metadataStandard={d.MetadataStandard}
        metadataStandardVersion={d.MetadataStandardVersion}
        referenceSystems={d.ReferenceSystems}
      />
    </div>
  );
}
