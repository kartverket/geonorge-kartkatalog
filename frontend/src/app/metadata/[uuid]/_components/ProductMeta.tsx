import { MetaField } from "@/app/metadata/[uuid]/_components/MetaField";
import { formatDate } from "@/app/metadata/[uuid]/_utils/utils";
import styles from "./ProductMeta.module.css";

// midlertidig, til vi vet om den skal være med
const relevantCategories = null;

export function ProductMeta({
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
          <span className="ds-tag" data-color="neutral">
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
        <MetaField label="Datakvalitet (FAIR-status)">
          {fairStatusPercent != null ? `${fairStatusPercent}%` : "-"}
        </MetaField>
      )}
      {relevantCategories && (
        <MetaField label="Relevante kategorier">
          <span className={styles.pending}>{relevantCategories}</span>
        </MetaField>
      )}
      {themes.length > 0 && (
        <MetaField label="Tema">
          <div className={styles.tags} data-color="success">
            {themes.map((t) => (
              <span className="ds-tag" key={t}>
                {t}
              </span>
            ))}
          </div>
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
