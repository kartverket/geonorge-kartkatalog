"use client";

import { Details, Heading, Tabs } from "@kv-designsystem/react";
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
  dateCreated,
  metadataStandard,
  metadataStandardVersion,
  referenceSystems,
}: {
  purpose: string;
  specificUsage: string;
  constraints: Constraints;
  dateCreated: string;
  metadataStandard: string;
  metadataStandardVersion: string;
  referenceSystems: ReferenceSystem[];
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

export function DatasetTabs({
  abstract,
  purpose,
  specificUsage,
  constraints,
  dateCreated,
  metadataStandard,
  metadataStandardVersion,
  referenceSystems,
}: {
  abstract: string;
  purpose: string;
  specificUsage: string;
  constraints: Constraints;
  dateCreated: string;
  metadataStandard: string;
  metadataStandardVersion: string;
  referenceSystems: ReferenceSystem[];
}) {
  const infoDetails = buildInfoDetails({
    purpose,
    specificUsage,
    constraints,
    dateCreated,
    metadataStandard,
    metadataStandardVersion,
    referenceSystems,
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
          <DetailAccordion items={infoDetails} />
        </Tabs.Panel>

        <Tabs.Panel value="distribution" className={styles.panel}>
          Distribusjoner-innhold kommer
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
