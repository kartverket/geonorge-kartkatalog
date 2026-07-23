"use client";

import { Details, Heading, Tabs, Tag } from "@kv-designsystem/react";
import styles from "./DatasetTabs.module.css";

const TABS = [
  { value: "info", label: "Informasjon om datasettet" },
  { value: "distribution", label: "Distribusjoner for datasett" },
  { value: "documentation", label: "Dokumentasjon" },
  { value: "quality", label: "Datakvalitet (FAIR)" },
];

const formatDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("nb-NO", { dateStyle: "long" }) : "-";

type Constraints = {
  UseLimitations: string;
  AccessConstraints: string;
  SecurityConstraints: string;
  UseConstraints: string;
  OtherConstraintsLink: string;
  OtherConstraintsLinkText: string;
};

type ReferenceSystem = {
  CoordinateSystem: string;
  CoordinateSystemUrl: string;
};

type DistributionGroup = {
  ProtocolName: string;
  ProtocolDescription: string;
  Formats: { FormatName: string }[];
  URL: string[];
  UnitsOfDistribution?: string;
};

type DetailItem = { title: string; content: React.ReactNode };

function DetailAccordion({ items }: { items: DetailItem[] }) {
  return (
    <>
      {items.map((item) => (
        <Details key={item.title}>
          <Details.Summary>{item.title}</Details.Summary>
          <Details.Content>{item.content}</Details.Content>
        </Details>
      ))}
    </>
  );
}

function buildInfoDetails({
  purpose,
  specificUsage,
  constraints,
}: {
  purpose: string;
  specificUsage: string;
  constraints: Constraints;
}): DetailItem[] {
  return [
    {
      title: "Bruksområde og formål",
      content: (
        <>
          <p>{purpose}</p>
          <p>{specificUsage}</p>
        </>
      ),
    },
    {
      title: "Lisens og restriksjoner",
      content: (
        <>
          <p>Bruksbegrensninger: {constraints.UseLimitations}</p>
          <p>Tilgangsrestriksjoner: {constraints.AccessConstraints}</p>
          <p>Sikkerhetsnivå: {constraints.SecurityConstraints}</p>
          <p>Brukerrestriksjoner: {constraints.UseConstraints}</p>
          <p>
            Lisens:{" "}
            <a
              href={constraints.OtherConstraintsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {constraints.OtherConstraintsLinkText}
            </a>
          </p>
        </>
      ),
    },
    {
      title: "Prosesshistorie",
      content: <p className={styles.pending}>Innhold kommer</p>,
    },
    {
      title: "Detaljert informasjon",
      content: <p className={styles.pending}>Innhold kommer</p>,
    },
  ];
}

function buildDistributionDetails({
  groups,
  representation,
  referenceSystems,
  dateUpdated,
  maintenanceFrequency,
}: {
  groups: DistributionGroup[];
  representation: string;
  referenceSystems: ReferenceSystem[];
  dateUpdated: string;
  maintenanceFrequency: string;
}): DetailItem[] {
  return groups.map((group) => ({
    title: group.ProtocolName,
    content: (
      <>
        <p>Beskrivelse: {group.ProtocolDescription}</p>
        <p>Representasjonsform: {representation}</p>
        <p>
          Formater:{" "}
          <span className={styles.tags} data-color="neutral">
            {group.Formats.map((f) => (
              <Tag key={f.FormatName}>{f.FormatName}</Tag>
            ))}
          </span>
        </p>
        {group.URL.length === group.Formats.length ? (
          group.Formats.map((f, i) => (
            <p key={f.FormatName}>
              {f.FormatName}:{" "}
              <a
                href={group.URL[i]}
                target="_blank"
                rel="noopener
  noreferrer"
              >
                {group.URL[i]}
              </a>
            </p>
          ))
        ) : (
          <p>
            Tilgangs-URL:{" "}
            <a
              href={group.URL[0]}
              target="_blank"
              rel="noopener
  noreferrer"
            >
              {group.URL[0]}
            </a>
          </p>
        )}

        {group.UnitsOfDistribution && (
          <p>
            Geografisk distribusjonsinndeling:
            {group.UnitsOfDistribution}
          </p>
        )}
        <p>
          Romlig referansesystem:{" "}
          <span className={styles.tags} data-color="neutral">
            {referenceSystems.map((rs) => (
              <Tag key={rs.CoordinateSystemUrl}>{rs.CoordinateSystem}</Tag>
            ))}
          </span>
        </p>
        <p>Datasett sist oppdatert: {formatDate(dateUpdated)}</p>
        <p>Oppdateringshyppighet: {maintenanceFrequency}</p>
      </>
    ),
  }));
}

export function DatasetTabs({
  abstract,
  purpose,
  specificUsage,
  constraints,
  representation,
  referenceSystems,
  distributionGroups,
  dateUpdated,
  maintenanceFrequency,
}: {
  abstract: string;
  purpose: string;
  specificUsage: string;
  constraints: Constraints;
  representation: string;
  referenceSystems: ReferenceSystem[];
  distributionGroups: DistributionGroup[];
  dateUpdated: string;
  maintenanceFrequency: string;
}) {
  const infoDetails = buildInfoDetails({
    purpose,
    specificUsage,
    constraints,
  });
  const distributionDetails = buildDistributionDetails({
    groups: distributionGroups,
    representation,
    referenceSystems,
    dateUpdated,
    maintenanceFrequency,
  });
  return (
    <div data-color="info">
      <Tabs defaultValue="info" className={styles.tabs}>
        <Tabs.List>
          {TABS.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="info" className={styles.panel}>
          <Heading data-size="xs">Om datasettet</Heading>
          <p className={styles.abstract}>{abstract}</p>
          <div className={styles.accordionGroup} data-color="neutral">
            <DetailAccordion items={infoDetails} />
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="distribution" className={styles.panel}>
          <div className={styles.accordionGroup} data-color="neutral">
            <DetailAccordion items={distributionDetails} />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="documentation" className={styles.panel}>
          Dokumentasjon-innhold kommer
        </Tabs.Panel>
        <Tabs.Panel value="quality" className={styles.panel}>
          Datakvalitet-innhold kommer
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
