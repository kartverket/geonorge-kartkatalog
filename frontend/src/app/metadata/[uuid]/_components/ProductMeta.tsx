import { MetaField } from "@/app/metadata/[uuid]/_components/MetaField";
import { ThemeTags } from "@/app/metadata/[uuid]/_components/ThemeTags";
import { formatDate } from "@/app/metadata/[uuid]/_utils/utils";
import styles from "./ProductMeta.module.css";

export function ProductMeta({
  spatialScope,
  representation,
  maintenanceFrequency,
  resolutionScale,
  dateUpdated,
  themes,
  formats,
  fairStatusPercent,
  relevantCategories,
}: {
  spatialScope: string | null;
  representation: string | null;
  maintenanceFrequency: string | null;
  resolutionScale: string | null;
  dateUpdated: string | null;
  themes: string[];
  formats: string[];
  fairStatusPercent: number | null;
  relevantCategories: string[];
}) {
  return (
    <dl className={styles.grid}>
      {spatialScope && (
        <MetaField
          label="Dekningsområde"
          help="Hvilket geografisk område datasettet dekker"
        >
          {spatialScope}
        </MetaField>
      )}
      {maintenanceFrequency && (
        <MetaField
          label="Oppdateringshyppighet"
          help="Hvor ofte datasettet oppdateres fra kilden"
        >
          {maintenanceFrequency}
        </MetaField>
      )}
      {dateUpdated && (
        <MetaField
          label="Sist oppdatert"
          help="Dato dataene sist ble hentet ut fra kilden"
        >
          {formatDate(dateUpdated)}
        </MetaField>
      )}
      {representation && (
        <MetaField
          label="Representasjonsform"
          help="Hvordan de geografiske dataene er representert"
        >
          <span className="ds-tag" data-color="info">
            {representation}
          </span>
        </MetaField>
      )}
      {resolutionScale && (
        <MetaField
          label="Målestokktall"
          help="Målestokken dataene er produsert i"
        >
          {resolutionScale}
        </MetaField>
      )}
      {fairStatusPercent && (
        <MetaField
          label="Metadatakvalitet (FAIR-status)"
          help="FAIR står for Findable, Accessible, Interoperable, Reusable"
        >
          {fairStatusPercent != null ? `${fairStatusPercent}%` : "-"}
        </MetaField>
      )}
      {relevantCategories.length > 0 && (
        <MetaField
          label="Initiativer og samarbeid"
          help="Nasjonale og internasjonale samarbeidsinitiativ datasettet inngår i"
        >
          <ThemeTags themes={relevantCategories} data-color="info" />
        </MetaField>
      )}
      {themes.length > 0 && (
        <MetaField label="Tema">
          <ThemeTags themes={themes} data-color="info" />
        </MetaField>
      )}
      {formats.length > 0 && (
        <MetaField label="Filformater" help="Tilgjengelige nedlastingsformater">
          <div className={styles.tags} data-color="info">
            {formats.map((f) => (
              <span className="ds-tag" key={f}>
                {f}
              </span>
            ))}
          </div>
        </MetaField>
      )}
    </dl>
  );
}
