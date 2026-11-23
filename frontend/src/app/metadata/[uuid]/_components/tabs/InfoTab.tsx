import { Heading } from "@kv-designsystem/react";
import {
  DetailAccordion,
  FieldAccordion,
} from "@/app/metadata/[uuid]/_components/shared/DetailAccordion";
import { TabPanel } from "@/app/metadata/[uuid]/_components/shared/TabPanel";
import styles from "@/app/metadata/[uuid]/_components/tabs/ProductTabs.module.css";
import { getProductTypeDefiniteString } from "@/lib/productType";
import type { ProductConstraints } from "@/lib/schemas/product";

type InfoTabProps = {
  hierarchyLevel: string | null;
  abstract: string | null;
  specificUsage: string | null;
  purpose: string | null;
  processHistory?: string | null;
  supplementalDescription?: string | null;
  helpUrl?: string | null;
  constraints: ProductConstraints;
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
      <div className={styles.accordionGroup}>
        <UsageAccordion specificUsage={specificUsage} purpose={purpose} />
        <LicenseAccordion constraints={constraints} />
        <ProcessHistoryAccordion processHistory={processHistory} />
        <HelpAccordion
          supplementalDescription={supplementalDescription}
          helpUrl={helpUrl}
        />
        <DetailAccordion title="Detaljert informasjon">
          <p className={styles.pending}>Innhold kommer</p>
        </DetailAccordion>
      </div>
    </TabPanel>
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

  return (
    <FieldAccordion
      title={title}
      fields={[
        { label: "Bruksområde", content: specificUsage },
        { label: "Formål", content: showPurpose ? purpose : null },
      ]}
    />
  );
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

  return (
    <FieldAccordion
      title="Lisens og restriksjoner"
      fields={[
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
      ]}
    />
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
