import { MetaField } from "@/app/metadata/[uuid]/_components/MetaField";
import { formatDate } from "@/app/metadata/[uuid]/_utils/utils";
import styles from "./DatasetMeta.module.css";

export function DatasetMeta({
  spatialScope,
  representation,
  maintenanceFrequency,
  resolutionScale,
  dateUpdated,
  themes,
  formats,
  fairStatusPercent,
}: {
  spatialScope: string | null;
  representation: string | null;
  maintenanceFrequency: string | null;
  resolutionScale: string | null;
  dateUpdated: string | null;
  themes: string[];
  formats: string[];
  fairStatusPercent: number | null;
}) {
  return (
    <dl className={styles.grid}>
      <MetaField
        label="Dekningsområde"
        help="Hvor stort geografisk område datasettet dekker"
      >
        {spatialScope ?? "-"}
      </MetaField>
      <MetaField
        label="Oppdateringshyppighet"
        help="Hvor ofte datasettet oppdateres"
      >
        {maintenanceFrequency ?? "-"}
      </MetaField>
      <MetaField
        label="Sist oppdatert"
        help="Dato for siste oppdatering av data"
      >
        {formatDate(dateUpdated ?? undefined)}
      </MetaField>
      <MetaField
        label="Representasjonsform"
        help="Hvordan geodataene er representert"
      >
        <span className="ds-tag" data-color="neutral">
          {representation ?? "-"}
        </span>
      </MetaField>
      <MetaField label="Målestokktall" help="Målestokk datasettet er egnet for">
        {resolutionScale ?? "-"}
      </MetaField>
      <MetaField
        label="Datakvalitet (FAIR-status)"
        help="Datasettets FAIR-score"
      >
        {fairStatusPercent != null ? `${fairStatusPercent}%` : "-"}
      </MetaField>
      {/* Relevante kategorier: ikke tilgjengelig */}
      <MetaField
        label="Relevante kategorier"
        help="Kategorier datasettet tilhører"
      >
        <span className={styles.pending}>Ikke tilgjengelig</span>
      </MetaField>
      <MetaField label="Tema" help="Emneord knyttet til datasettet">
        <div className={styles.tags} data-color="success">
          {themes.map((t) => (
            <span className="ds-tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      </MetaField>
      <MetaField label="Filformater" help="Tilgjengelige nedlastingsformater">
        <div className={styles.tags} data-color="info">
          {formats.map((f) => (
            <span className="ds-tag" key={f}>
              {f}
            </span>
          ))}
        </div>
      </MetaField>
    </dl>
  );
}
