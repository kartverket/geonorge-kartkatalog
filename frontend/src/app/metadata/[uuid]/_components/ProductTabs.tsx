"use client";

import { Details, Heading, Tabs, Tag } from "@kv-designsystem/react";
import { LinkIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import { ProductDocumentation } from "@/app/metadata/[uuid]/_components/ProductDocumentation";
import { LinkedDistributionsSection } from "@/app/metadata/[uuid]/_components/LinkedDistributionsSection";
import { formatDate } from "@/app/metadata/[uuid]/_utils/utils";
import type {
  DistributionGroup,
  LinkedDistributions,
  ProductConstraints,
  ProductFairStatus,
  ReferenceSystem,
} from "@/lib/schemas/product";
import styles from "./ProductTabs.module.css";

const TABS = [
  { value: "info", label: "Informasjon om datasettet" },
  { value: "distribution", label: "Distribusjoner for datasett" },
  { value: "documentation", label: "Dokumentasjon" },
];

export function ProductTabs({
  abstract,
  specificUsage,
  purpose,
  processHistory,
  constraints,
  referenceSystems,
  distributionGroups,
  linkedDistributions,
  dateUpdated,
  maintenanceFrequency,
  fairStatus,
}: {
  abstract: string | null;
  specificUsage: string | null;
  purpose: string | null;
  processHistory?: string | null;
  constraints: ProductConstraints;
  referenceSystems: ReferenceSystem[];
  distributionGroups: DistributionGroup[];
  linkedDistributions: LinkedDistributions;
  dateUpdated: string | null;
  maintenanceFrequency: string | null;
  fairStatus: ProductFairStatus | null;
}) {
  const infoDetails = buildInfoDetails({
    specificUsage,
    purpose,
    processHistory,
    constraints,
  });
  const distributionDetails = buildDistributionDetails({
    groups: distributionGroups,
    referenceSystems,
    dateUpdated,
    maintenanceFrequency,
  });
  const tabs = [
    ...TABS,
    ...(fairStatus ? [{ value: "quality", label: "Datakvalitet (FAIR)" }] : []),
  ];
  const fairDetails = fairStatus ? buildFairDetails(fairStatus) : null;
  return (
    <div data-color="info">
      <Tabs defaultValue="info" className={styles.tabs}>
        <Tabs.List>
          {tabs.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="info" className={styles.panel}>
          <div className={styles.headingGroup}>
            <Heading data-size="xs">Om datasettet</Heading>
            <p className={styles.abstract}>{abstract ?? "-"}</p>
          </div>
          <div className={styles.accordionGroup} data-color="neutral">
            <DetailAccordion items={infoDetails} />
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="distribution" className={styles.panel}>
          <div className={styles.accordionGroup} data-color="neutral">
            <DetailAccordion items={distributionDetails} />
          </div>
          <LinkedDistributionsSection
            linkedDistributions={linkedDistributions}
          />
        </Tabs.Panel>
        <Tabs.Panel value="documentation" className={styles.panel}>
          <ProductDocumentation />
        </Tabs.Panel>
        {fairStatus && (
          <Tabs.Panel value="quality" className={styles.panel}>
            <div className={styles.headingGroup}>
              <Heading data-size="sm">Datakvalitet (FAIR-status)</Heading>
              <p>
                En FAIR-status gir en kort vurdering av hvor godt et datasett
                følger FAIR-prinsippene: Findable (søkbarhet), Accessible
                (tilgjengelighet), Interoperabel (interoperabilitet), Reusable
                (gjenbrukbar).
              </p>
            </div>
            <div className={styles.headingGroup}>
              <Heading data-size="sm">Resultater for dette datasettet</Heading>
              <p>Total vurdering: {fairStatus.totalPercent ?? "-"}%.</p>
            </div>
            <div className={styles.accordionGroup} data-color="neutral">
              <DetailAccordion items={fairDetails ?? []} />
            </div>
          </Tabs.Panel>
        )}
      </Tabs>
    </div>
  );
}

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
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.urlText}
        >
          {url}
        </a>
      </span>
      <button type="button" className={styles.copyButton} onClick={copy}>
        <LinkIcon aria-hidden />
        {copied ? "Kopiert" : "Kopiér lenke"}
      </button>
    </div>
  );
}

function buildFormatUrlRows(formats: DistributionGroup["formats"]) {
  const byUrls = new Map<string, string[]>();
  formats.forEach((format) => {
    const key = format.urls.join("|");
    byUrls.set(key, [...(byUrls.get(key) ?? []), format.name]);
  });

  const entries = [...byUrls.entries()];
  const isSingleSharedUrl =
    entries.length === 1 && entries[0][0].split("|").length === 1;

  return entries.flatMap(([key, names]) => {
    const urls = key ? key.split("|") : [];
    return urls.map((url, i) => ({
      label: isSingleSharedUrl
        ? "Tilgangs-URL"
        : urls.length > 1
          ? `${names.join(", ")} (${i + 1})`
          : names.join(", "),
      content: <UrlLink url={url} />,
    }));
  });
}

function buildInfoDetails({
  specificUsage,
  purpose,
  processHistory,
  constraints,
}: {
  specificUsage: string | null;
  purpose: string | null;
  processHistory?: string | null;
  constraints: ProductConstraints;
}): DetailItem[] {
  return [
    ...(specificUsage || purpose
      ? [
          {
            title: "Bruksområde og formål",
            content: (
              <FieldList
                fields={[
                  ...(specificUsage
                    ? [{ label: "Bruksområde", content: specificUsage }]
                    : []),
                  ...(purpose && purpose !== specificUsage
                    ? [{ label: "Formål", content: purpose }]
                    : []),
                ]}
              />
            ),
          },
        ]
      : []),
    {
      title: "Lisens og restriksjoner",
      content: (
        <FieldList
          fields={[
            {
              label: "Bruksbegrensninger",
              content: constraints.useLimitations?.join(", ") ?? "-",
            },
            {
              label: "Tilgangsrestriksjoner",
              content: constraints.accessConstraints ?? "-",
            },
            {
              label: "Brukerrestriksjoner",
              content: constraints.useConstraints ?? "-",
            },
            {
              label: "Lisens",
              content: constraints.otherConstraintsLink ? (
                <a
                  href={constraints.otherConstraintsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {constraints.otherConstraintsLinkText}
                </a>
              ) : (
                "-"
              ),
            },
            {
              label: "Sikkerhetsnivå",
              content: constraints.securityConstraints ?? "-",
            },
          ]}
        />
      ),
    },
    ...(processHistory
      ? [
          {
            title: "Prosesshistorie",
            content: <p>{processHistory}</p>,
          },
        ]
      : []),
    {
      title: "Detaljert informasjon",
      content: <p className={styles.pending}>Innhold kommer</p>,
    },
  ];
}

function buildDistributionDetails({
  groups,
  referenceSystems,
  dateUpdated,
  maintenanceFrequency,
}: {
  groups: DistributionGroup[];
  referenceSystems: ReferenceSystem[];
  dateUpdated: string | null;
  maintenanceFrequency: string | null;
}): DetailItem[] {
  return groups.map((group) => ({
    title: group.protocolName ?? "Ukjent protokoll",
    content: (
      <FieldList
        fields={[
          { label: "Beskrivelse", content: group.protocolDescription },
          ...buildFormatUrlRows(group.formats),
          {
            label: "Formater",
            content: (
              <span className={styles.tags} data-color="info">
                {group.formats.map((f) => (
                  <Tag key={f.name}>{f.name}</Tag>
                ))}
              </span>
            ),
          },
          {
            label: "Oppdateringsfrekvens",
            content: maintenanceFrequency ?? "-",
          },
          { label: "Ressurs sist oppdatert", content: formatDate(dateUpdated) },
          ...(group.unitsOfDistribution
            ? [
                {
                  label: "Geografisk distribusjonsinndeling",
                  content: (
                    <span className={styles.tags} data-color="neutral">
                      {group.unitsOfDistribution.split(",").map((unit) => (
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
                  <Tag key={rs.codeSpace}>{rs.code}</Tag>
                ))}
              </span>
            ),
          },
        ]}
      />
    ),
  }));
}

function buildFairDetails(fairStatus: ProductFairStatus): DetailItem[] {
  return [
    {
      title: "Søkbarhet (Findable)",
      content: <p>Søkbarhet: {fairStatus.findablePercent ?? "-"}%</p>,
    },
    {
      title: "Tilgjengelighet (Accessible)",
      content: <p>Tilgjengelighet: {fairStatus.accessiblePercent ?? "-"}%</p>,
    },
    {
      title: "Interoperabilitet (Interoperable)",
      content: (
        <p>Interoperabilitet: {fairStatus.interoperablePercent ?? "-"}%</p>
      ),
    },
    {
      title: "Gjenbrukbar (Reusable)",
      content: <p>Gjenbrukbar: {fairStatus.reusablePercent ?? "-"}%</p>,
    },
  ];
}
