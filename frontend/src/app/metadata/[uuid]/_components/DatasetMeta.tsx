"use client";

import { Button, Tag, Tooltip } from "@kv-designsystem/react";
import { QuestionmarkCircleIcon } from "@navikt/aksel-icons";
import styles from "./DatasetMeta.module.css";

const formatDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("nb-NO", { dateStyle: "long" }) : "-";

function MetaField({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className={styles.dt}>
        {label}
        <Tooltip content={help} placement="top">
          <Button
            aria-label={`Mer informasjon om ${label}`}
            variant="tertiary"
            icon
          >
            <QuestionmarkCircleIcon aria-hidden />
          </Button>
        </Tooltip>
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

export function DatasetMeta({
  spatialScope,
  representation,
  maintenanceFrequency,
  resolutionScale,
  dateUpdated,
  themes,
  formats,
}: {
  spatialScope: string;
  representation: string;
  maintenanceFrequency: string;
  resolutionScale: string;
  dateUpdated: string;
  themes: string[];
  formats: string[];
}) {
  return (
    <dl className={styles.grid}>
      <MetaField
        label="Dekningsområde"
        help="Hvor stort geografisk område datasettet dekker"
      >
        {spatialScope}
      </MetaField>
      <MetaField
        label="Oppdateringshyppighet"
        help="Hvor ofte datasettet oppdateres"
      >
        {maintenanceFrequency}
      </MetaField>
      <MetaField
        label="Sist oppdatert"
        help="Dato for siste oppdatering av data"
      >
        {formatDate(dateUpdated)}
      </MetaField>
      <MetaField
        label="Representasjonsform"
        help="Hvordan geodataene er representert"
      >
        <Tag data-color="neutral">{representation}</Tag>
      </MetaField>
      <MetaField label="Målestokktall" help="Målestokk datasettet er egnet for">
        {resolutionScale}
      </MetaField>
      {/* Datakvalitet: ikke tilgjengelig */}
      <MetaField
        label="Datakvalitet (FAIR-status)"
        help="Datasettets FAIR-score"
      >
        <span className={styles.pending}>Ikke tilgjengelig</span>
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
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </MetaField>
      <MetaField label="Filformater" help="Tilgjengelige nedlastingsformater">
        <div className={styles.tags} data-color="info">
          {formats.map((f) => (
            <Tag key={f}>{f}</Tag>
          ))}
        </div>
      </MetaField>
    </dl>
  );
}
