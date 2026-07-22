import { getMetadataSummary } from "@/app/api";
import getData from "../../../mocks/getData.json";
import { DatasetActions } from "./_components/DatasetActions";
import { DatasetHeader } from "./_components/DatasetHeader";
import { DatasetMeta } from "./_components/DatasetMeta";
import { DatasetThumbnail } from "./_components/DatasetThumbnail";
import styles from "./page.module.css";

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const d = getData;
  const thumb =
    d.Thumbnails.find((t) => t.Type === "medium")?.URL ?? d.Thumbnails[0]?.URL;

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
    </div>
  );
}
