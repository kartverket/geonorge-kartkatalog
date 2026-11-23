import { Heading } from "@kv-designsystem/react";
import accordionGroupStyles from "@/app/metadata/[uuid]/_components/shared/AccordionGroup.module.css";
import { DetailAccordion } from "@/app/metadata/[uuid]/_components/shared/DetailAccordion";
import type { Field } from "@/app/metadata/[uuid]/_components/shared/FieldList";
import { FieldTable } from "@/app/metadata/[uuid]/_components/shared/FieldTable";
import { TabPanel } from "@/app/metadata/[uuid]/_components/shared/TabPanel";
import styles from "@/app/metadata/[uuid]/_components/tabs/InfoTab.module.css";
import {
  getVisibleFields,
  hasVisibleFields,
} from "@/app/metadata/[uuid]/_utils/tableContent";
import { formatDateNumeric } from "@/app/metadata/[uuid]/_utils/utils";
import { getProductTypeDefiniteString } from "@/lib/productType";
import type {
  ProductBoundingBox,
  ProductConstraints,
  ProductValidityPeriod,
} from "@/lib/schemas/product";

type InfoTabProps = {
  hierarchyLevel: string | null;
  abstract: string | null;
  specificUsage: string | null;
  purpose: string | null;
  processHistory: string | null;
  supplementalDescription: string | null;
  helpUrl: string | null;
  constraints: ProductConstraints;
  datePublished: string | null;
  dateUpdated: string | null;
  dateMetadataUpdated: string | null;
  validityPeriod: ProductValidityPeriod | null;
  geographicAreas: string[];
  boundingBox: ProductBoundingBox | null;
  cloudCoverPercentage: number | null;
  collaborationAndLaws: string[];
  datasetLanguage: string | null;
  namespace: string | null;
  datasetId: string | null;
};

export function InfoTab({
  hierarchyLevel,
  abstract,
  specificUsage,
  purpose,
  processHistory,
  supplementalDescription,
  helpUrl,
  constraints,
  datePublished,
  dateUpdated,
  dateMetadataUpdated,
  validityPeriod,
  geographicAreas,
  boundingBox,
  cloudCoverPercentage,
  collaborationAndLaws,
  datasetLanguage,
  namespace,
  datasetId,
}: InfoTabProps) {
  const productTypeDefinite = getProductTypeDefiniteString(hierarchyLevel);

  return (
    <TabPanel value="info">
      {abstract && (
        <div className={styles.headingGroup}>
          <Heading data-size="xs">Om {productTypeDefinite}</Heading>
          <p className={styles.abstract}>{abstract}</p>
        </div>
      )}
      <div className={accordionGroupStyles.accordionGroup}>
        <UsageAccordion specificUsage={specificUsage} purpose={purpose} />
        <WhenAndWhereAccordion
          datePublished={datePublished}
          dateUpdated={dateUpdated}
          dateMetadataUpdated={dateMetadataUpdated}
          validityPeriod={validityPeriod}
          geographicAreas={geographicAreas}
          boundingBox={boundingBox}
          cloudCoverPercentage={cloudCoverPercentage}
        />
        <HelpAccordion
          supplementalDescription={supplementalDescription}
          helpUrl={helpUrl}
        />
        <LicenseAccordion constraints={constraints} />
        <ProcessHistoryAccordion processHistory={processHistory} />
        <DetailedInfoAccordion
          collaborationAndLaws={collaborationAndLaws}
          datasetLanguage={datasetLanguage}
          namespace={namespace}
          datasetId={datasetId}
        />
      </div>
    </TabPanel>
  );
}

function DetailedInfoAccordion({
  collaborationAndLaws,
  datasetLanguage,
  namespace,
  datasetId,
}: Pick<
  InfoTabProps,
  "collaborationAndLaws" | "datasetLanguage" | "namespace" | "datasetId"
>) {
  const fields: Field[] = [
    { label: "Samarbeid og lover", content: collaborationAndLaws.join(", ") },
    { label: "Språk i datasett", content: datasetLanguage },
    { label: "Navnerom til datasett", content: namespace },
    { label: "Datasett-ID", content: datasetId },
  ];

  if (!hasVisibleFields(fields)) return null;

  return (
    <DetailAccordion title="Detaljert informasjon">
      <FieldTable fields={fields} />
    </DetailAccordion>
  );
}

function UsageAccordion({
  specificUsage,
  purpose,
}: Pick<InfoTabProps, "specificUsage" | "purpose">) {
  const showPurpose = !!purpose && purpose !== specificUsage;

  const title =
    specificUsage && showPurpose
      ? "Bruksområde og formål"
      : specificUsage
        ? "Bruksområde"
        : "Formål";

  const fields: Field[] = [
    { label: "Bruksområde", content: specificUsage },
    { label: "Formål", content: showPurpose ? purpose : null },
  ];

  if (!hasVisibleFields(fields)) return null;

  return (
    <DetailAccordion title={title}>
      <FieldTable fields={fields} />
    </DetailAccordion>
  );
}

function WhenAndWhereAccordion({
  datePublished,
  dateUpdated,
  dateMetadataUpdated,
  validityPeriod,
  geographicAreas,
  boundingBox,
  cloudCoverPercentage,
}: Pick<
  InfoTabProps,
  | "datePublished"
  | "dateUpdated"
  | "dateMetadataUpdated"
  | "validityPeriod"
  | "geographicAreas"
  | "boundingBox"
  | "cloudCoverPercentage"
>) {
  const timeFields: Field[] = [
    { label: "Publiseringsdato", content: formatDateNumeric(datePublished) },
    { label: "Oppdatert (Ressurs)", content: formatDateNumeric(dateUpdated) },
    {
      label: "Oppdatert (Metadata)",
      content: formatDateNumeric(dateMetadataUpdated),
    },
    {
      label: "Gyldighetsperiode",
      content: formatValidityPeriod(validityPeriod),
    },
  ];

  const spatialFields: Field[] = [
    {
      label: "Geografisk område",
      content: geographicAreas.length > 0 ? geographicAreas.join(", ") : null,
    },
    { label: "Koordinater", content: formatBoundingBox(boundingBox) },
    {
      label: "Skydekke prosent",
      content:
        cloudCoverPercentage !== null ? `${cloudCoverPercentage}%` : null,
    },
  ];

  const sections = [
    {
      title: "Tidsparametre",
      fields: getVisibleFields(timeFields),
    },
    {
      title: "Romlige parametre",
      fields: getVisibleFields(spatialFields),
    },
  ].filter((section) => section.fields.length > 0);

  if (sections.length === 0) return null;

  return (
    <DetailAccordion title="Når og hvor">
      {sections.map((section) => (
        <FieldTable
          key={section.title}
          title={section.title}
          fields={section.fields}
        />
      ))}
    </DetailAccordion>
  );
}

function formatValidityPeriod(period: ProductValidityPeriod | null) {
  const from = formatDateNumeric(period?.from);
  const to = formatDateNumeric(period?.to);
  if (from && to) return `${from} – ${to}`;
  if (from) return `Fra og med ${from}`;
  if (to) return `Til og med ${to}`;
  return null;
}

function formatBoundingBox(box: ProductBoundingBox | null) {
  if (!box) return null;
  return `Nord ${box.northBoundLatitude}°, Sør ${box.southBoundLatitude}°, Øst ${box.eastBoundLongitude}°, Vest ${box.westBoundLongitude}°`;
}

function LicenseAccordion({
  constraints,
}: {
  constraints: ProductConstraints;
}) {
  const {
    useLimitations,
    accessConstraints,
    useConstraints,
    otherConstraintsLink,
    otherConstraintsLinkText,
    securityConstraints,
  } = constraints;

  const fields: Field[] = [
    { label: "Bruksbegrensninger", content: useLimitations?.join(", ") },
    { label: "Tilgangsrestriksjoner", content: accessConstraints },
    { label: "Brukerrestriksjoner", content: useConstraints },
    {
      label: "Lisens",
      content: otherConstraintsLink && (
        <a
          href={otherConstraintsLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {otherConstraintsLinkText}
        </a>
      ),
    },
    { label: "Sikkerhetsnivå", content: securityConstraints },
  ];

  if (!hasVisibleFields(fields)) return null;

  return (
    <DetailAccordion title="Lisens og restriksjoner">
      <FieldTable fields={fields} />
    </DetailAccordion>
  );
}

function ProcessHistoryAccordion({
  processHistory,
}: Pick<InfoTabProps, "processHistory">) {
  if (!processHistory) return null;

  return (
    <DetailAccordion title="Prosesshistorie">
      <p>{processHistory}</p>
    </DetailAccordion>
  );
}

function HelpAccordion({
  supplementalDescription,
  helpUrl,
}: Pick<InfoTabProps, "supplementalDescription" | "helpUrl">) {
  if (!supplementalDescription) return null;

  return (
    <DetailAccordion title="Hjelp til bruk">
      <p className={styles.abstract}>{supplementalDescription}</p>
      {helpUrl && (
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.helpLink}
        >
          Les mer
        </a>
      )}
    </DetailAccordion>
  );
}
