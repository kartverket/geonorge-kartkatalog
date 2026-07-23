"use client";

import { Details, Heading, Tabs, Tag } from "@kv-designsystem/react";
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

type Field = { label: string; content: React.ReactNode };

function FieldList({ fields }: { fields: Field[] }) {
  return (
    <dl className={styles.fieldList}>
      {fields.map((f) => (
        <div className={styles.fieldRow} key={f.label}>
          <dt className={styles.fieldLabel}>{f.label}</dt>
          <dd className={styles.fieldValue}>{f.content}</dd>
        </div>
      ))}
    </dl>
  );
}

function UrlLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={styles.urlBox}>
      <span className={styles.urlValue}>
        <span className={styles.urlText}>{url}</span>
      </span>
      <button type="button" className={styles.copyButton} onClick={copy}>
        <LinkIcon aria-hidden />
        {copied ? "Kopiert" : "Kopiér lenke"}
      </button>
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
        <FieldList
          fields={[
            { label: "Bruksområde", content: purpose },
            { label: "Spesifikk bruk", content: specificUsage },
          ]}
        />
      ),
    },
    {
      title: "Lisens og restriksjoner",
      content: (
        <FieldList
          fields={[
            {
              label: "Bruksbegrensninger",
              content: constraints.UseLimitations,
            },
            {
              label: "Tilgangsrestriksjoner",
              content: constraints.AccessConstraints,
            },
            {
              label: "Sikkerhetsnivå",
              content: constraints.SecurityConstraints,
            },
            {
              label: "Brukerrestriksjoner",
              content: constraints.UseConstraints,
            },
            {
              label: "Lisens",
              content: (
                <a
                  href={constraints.OtherConstraintsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {constraints.OtherConstraintsLinkText}
                </a>
              ),
            },
          ]}
        />
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
      <FieldList
        fields={[
          { label: "Beskrivelse", content: group.ProtocolDescription },
          ...(group.URL.length === group.Formats.length
            ? group.Formats.map((f, i) => ({
                label: f.FormatName,
                content: <UrlLink url={group.URL[i]} />,
              }))
            : [
                {
                  label: "Tilgangs-URL",
                  content: <UrlLink url={group.URL[0]} />,
                },
              ]),
          {
            label: "Formater",
            content: (
              <span className={styles.tags} data-color="neutral">
                {group.Formats.map((f) => (
                  <Tag key={f.FormatName}>{f.FormatName}</Tag>
                ))}
              </span>
            ),
          },
          { label: "Oppdateringsfrekvens", content: maintenanceFrequency },
          { label: "Ressurs sist oppdatert", content: formatDate(dateUpdated) },
          ...(group.UnitsOfDistribution
            ? [
                {
                  label: "Geografisk distribusjonsinndeling",
                  content: (
                    <span className={styles.tags} data-color="neutral">
                      {group.UnitsOfDistribution.split(",").map((unit) => (
                        <Tag key={unit}>{unit.trim()}</Tag>
                      ))}
                    </span>
                  ),
                },
              ]
            : []),
          {
            label: "Referansesystem",
            content: (
              <span className={styles.tags} data-color="neutral">
                {referenceSystems.map((rs) => (
                  <Tag key={rs.CoordinateSystemUrl}>{rs.CoordinateSystem}</Tag>
                ))}
              </span>
            ),
          },
        ]}
      />
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
