"use client";

import {
  Button,
  Details,
  Heading,
  Tabs,
  Tag,
  Textfield,
} from "@kv-designsystem/react";
import { LinkIcon } from "@navikt/aksel-icons";
import { useState } from "react";
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

function UrlField({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.urlBox}>
        <span className={styles.urlValue}>{url}</span>
        <button type="button" className={styles.copyButton} onClick={copy}>
          <LinkIcon aria-hidden />
          {copied ? "Kopiert" : "Kopiér lenke"}
        </button>
      </div>
    </div>
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

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Formater</span>
          <span className={styles.tags} data-color="neutral">
            {group.Formats.map((f) => (
              <Tag key={f.FormatName}>{f.FormatName}</Tag>
            ))}
          </span>
        </div>

        {group.URL.length === group.Formats.length ? (
          group.Formats.map((f, i) => (
            <UrlField
              key={f.FormatName}
              label={f.FormatName}
              url={group.URL[i]}
            />
          ))
        ) : (
          <UrlField label="Tilgangs-URL" url={group.URL[0]} />
        )}

        {group.UnitsOfDistribution && (
          <p>
            Geografisk distribusjonsinndeling:
            {group.UnitsOfDistribution}
          </p>
        )}

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Referansesystem</span>
          <span className={styles.tags} data-color="neutral">
            {referenceSystems.map((rs) => (
              <Tag key={rs.CoordinateSystemUrl}>{rs.CoordinateSystem}</Tag>
            ))}
          </span>
        </div>

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
