import {
  getFairStatus,
  getLinkedDistributions,
  type getMetadata,
  getProduktark,
  getTegneregler,
} from "@/app/api";
import { CopyButton } from "@/app/metadata/[uuid]/_components/CopyButton";
import {
  type DetailItem,
  ProductTabs,
} from "@/app/metadata/[uuid]/_components/ProductTabs";
import styles from "@/app/metadata/[uuid]/_components/ProductTabs.module.css";
import { formatDate, showCopyLink } from "@/app/metadata/[uuid]/_utils/utils";
import type {
  DistributionGroup,
  ProductConstraints,
  ReferenceSystem,
} from "@/lib/schemas/product";

const EMPTY_LINKED_DISTRIBUTIONS = {
  applications: [],
  viewServices: [],
  downloadServices: [],
  seriesMembers: [],
  parentSeries: [],
  relatedDatasets: [],
  serviceLayers: [],
  parentService: [],
};

export async function ProductTabsSection({
  uuid,
  metadata,
}: {
  uuid: string;
  metadata: Awaited<ReturnType<typeof getMetadata>>;
}) {
  const [
    fairStatusResult,
    tegnereglerResult,
    produktarkResult,
    linkedDistributionsResult,
  ] = await Promise.allSettled([
    getFairStatus(uuid),
    getTegneregler(uuid),
    getProduktark(uuid),
    getLinkedDistributions(uuid),
  ]);

  const fairStatus = unwrapSettled(
    fairStatusResult,
    "Kunne ikke laste FAIR-status",
    null,
  );

  const tegneregler = unwrapSettled(
    tegnereglerResult,
    "Kunne ikke laste tegneregler",
    null,
  );

  const produktark = unwrapSettled(
    produktarkResult,
    "Kunne ikke laste produktark",
    null,
  );

  const linkedDistributions = unwrapSettled(
    linkedDistributionsResult,
    "Kunne ikke laste koblede distribusjoner",
    EMPTY_LINKED_DISTRIBUTIONS,
  );

  const constraints = {
    ...metadata.constraints,
    securityConstraints: metadata.securityClassification,
  };

  const infoDetails = buildInfoDetails({
    specificUsage: metadata.specificUsage,
    purpose: metadata.purpose,
    processHistory: metadata.processHistory,
    supplementalDescription: metadata.supplementalDescription,
    helpUrl: metadata.helpUrl,
    constraints,
  });

  const distributionDetails = buildDistributionDetails({
    groups: metadata.distributionGroups,
    referenceSystems: metadata.referenceSystems,
    dateUpdated: metadata.dateUpdated,
    maintenanceFrequency: metadata.maintenanceFrequency,
  });

  return (
    <ProductTabs
      infoDetails={infoDetails}
      distributionDetails={distributionDetails}
      hierarchyLevel={metadata.hierarchyLevel}
      abstract={metadata.abstractText}
      linkedDistributions={linkedDistributions}
      fairStatus={fairStatus}
      tegneregler={tegneregler}
      produktark={produktark}
    />
  );
}

function buildInfoDetails({
  specificUsage,
  purpose,
  processHistory,
  supplementalDescription,
  helpUrl,
  constraints,
}: {
  specificUsage: string | null;
  purpose: string | null;
  processHistory?: string | null;
  supplementalDescription?: string | null;
  helpUrl?: string | null;
  constraints: ProductConstraints;
}): DetailItem[] {
  const hasSpecificUsage = !!specificUsage;
  const hasPurpose = !!purpose && purpose !== specificUsage;

  const usageTitle =
    hasSpecificUsage && hasPurpose
      ? "Bruksområde og formål"
      : hasSpecificUsage
        ? "Bruksområde"
        : "Formål";

  return [
    ...(specificUsage || purpose
      ? [
          {
            title: usageTitle,
            content: (
              <FieldList
                fields={[
                  ...(hasSpecificUsage
                    ? [{ label: "Bruksområde", content: specificUsage }]
                    : []),
                  ...(hasPurpose
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
    ...(supplementalDescription
      ? [
          {
            title: "Hjelp til bruk",
            content: (
              <>
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
              </>
            ),
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
  return groups.map((group) => {
    const formatUrls = buildFormatUrlRows(group.formats);
    return {
      actionButton:
        formatUrls.length === 1 && showCopyLink(group.protocol) ? (
          <CopyButton url={formatUrls[0].content.props.url} />
        ) : null,
      title: group.protocolName ?? "Ukjent protokoll",
      content: (
        <FieldList
          fields={[
            { label: "Beskrivelse", content: group.protocolDescription },
            ...formatUrls,
            {
              label: "Formater",
              content: (
                <span className={styles.tags} data-color="info">
                  {/* Filtering unique format names, to avoid duplicate Tags with same text */}
                  {[...new Set(group.formats.map((f) => f.name))].map(
                    (name) => (
                      <span className="ds-tag" key={name}>
                        {name}
                      </span>
                    ),
                  )}
                </span>
              ),
            },
            {
              label: "Oppdateringsfrekvens",
              content: maintenanceFrequency ?? "-",
            },
            {
              label: "Ressurs sist oppdatert",
              content: formatDate(dateUpdated),
            },
            ...(group.unitsOfDistribution
              ? [
                  {
                    label: "Geografisk distribusjonsinndeling",
                    content: (
                      <span className={styles.tags} data-color="neutral">
                        {group.unitsOfDistribution.split(",").map((unit) => (
                          <span className="ds-tag" key={unit}>
                            {unit.trim()}
                          </span>
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
                    <span className="ds-tag" key={rs.codeSpace}>
                      {rs.code}
                    </span>
                  ))}
                </span>
              ),
            },
          ]}
        />
      ),
    };
  });
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

type Field = { label: string; content: React.ReactNode };

function FieldList({ fields }: { fields: Field[] }) {
  return (
    <dl className={styles.fieldList}>
      {fields.map((f, i) => (
        <div className={styles.fieldRow} key={`${i}-${f.label}`}>
          <dt className={styles.fieldLabel}>{f.label}</dt>
          <dd className={styles.fieldValue}>{f.content}</dd>
        </div>
      ))}
    </dl>
  );
}

function UrlLink({ url }: { url: string }) {
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
      <CopyButton url={url} className={styles.copyButton} />
    </div>
  );
}

function unwrapSettled<T>(
  result: PromiseSettledResult<T>,
  errorMessage: string,
  fallback: T,
): T {
  if (result.status === "rejected") {
    console.error(errorMessage, result.reason);
    return fallback;
  }
  return result.value;
}
