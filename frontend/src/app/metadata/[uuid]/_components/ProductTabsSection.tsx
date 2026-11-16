import AddToDownloadsButton from "@/app/_components/addToDownloads/AddToDownloadsButton";
import type { DownloadItem } from "@/app/_components/addToDownloads/downloadStorage";
import {
  getFairStatus,
  type getMetadata,
  getProduktark,
  getProduktspesifikasjon,
  getTegneregler,
} from "@/app/api";
import { CopyButton } from "@/app/metadata/[uuid]/_components/CopyButton";
import { DistributionDetailActionButton } from "@/app/metadata/[uuid]/_components/DistributionDetailActionButton";
import {
  type DetailItem,
  ProductTabs,
} from "@/app/metadata/[uuid]/_components/ProductTabs";
import styles from "@/app/metadata/[uuid]/_components/ProductTabs.module.css";
import { isGeonorgeDownloadProtocol } from "@/app/metadata/[uuid]/_utils/distributionProtocols";
import {
  getDownloadableSeriesMembers,
  getThematicParentSeriesDownloadItem,
} from "@/app/metadata/[uuid]/_utils/distributions";
import { formatDate, unwrapSettled } from "@/app/metadata/[uuid]/_utils/utils";
import type {
  DistributionGroup,
  LinkedDistributions,
  ProductConstraints,
  ReferenceSystem,
} from "@/lib/schemas/product";
import { LOCATIONS } from "@/posthog/posthog";

export async function ProductTabsSection({
  uuid,
  metadata,
  linkedDistributions,
}: {
  uuid: string;
  metadata: Awaited<ReturnType<typeof getMetadata>>;
  linkedDistributions: LinkedDistributions;
}) {
  const [
    fairStatusResult,
    tegnereglerResult,
    produktarkResult,
    produktspesifikasjonResult,
  ] = await Promise.allSettled([
    getFairStatus(uuid),
    getTegneregler(uuid),
    getProduktark(uuid),
    getProduktspesifikasjon(uuid),
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

  const produktspesifikasjon = unwrapSettled(
    produktspesifikasjonResult,
    "Kunne ikke laste produktspesifikasjon",
    null,
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

  const isThematicSeries =
    metadata.hierarchyLevel === "series" &&
    metadata.seriesType === "series_thematic";
  const downloadableSeriesMembers = isThematicSeries
    ? []
    : getDownloadableSeriesMembers(linkedDistributions);

  const distributionDetails = buildDistributionDetails({
    uuid,
    title: metadata.title,
    organizationName: metadata.organization,
    hierarchyLevel: metadata.hierarchyLevel,
    seriesType: metadata.seriesType,
    accessState: metadata.accessState,
    groups: metadata.distributionGroups,
    referenceSystems: metadata.referenceSystems,
    dateUpdated: metadata.dateUpdated,
    maintenanceFrequency: metadata.maintenanceFrequency,
    thematicSeriesDownloadItem:
      getThematicParentSeriesDownloadItem(linkedDistributions),
    downloadableSeriesMembers,
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
      produktspesifikasjon={produktspesifikasjon}
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
  uuid,
  title,
  organizationName,
  hierarchyLevel,
  seriesType,
  accessState,
  groups,
  referenceSystems,
  dateUpdated,
  maintenanceFrequency,
  thematicSeriesDownloadItem,
  downloadableSeriesMembers,
}: {
  uuid: string;
  title: string;
  organizationName: string | null;
  hierarchyLevel: string | null;
  seriesType: string | null;
  accessState: "restricted" | "open" | "protected" | null;
  groups: DistributionGroup[];
  referenceSystems: ReferenceSystem[];
  dateUpdated: string | null;
  maintenanceFrequency: string | null;
  thematicSeriesDownloadItem: DownloadItem | null;
  downloadableSeriesMembers: DownloadItem[];
}): DetailItem[] {
  const groupDetails = groups.map((group) => {
    const urlRows = buildUrlRows(group.entries);
    const formatNames = getGroupFormatNames(group.entries);
    const firstUrlRowLabel = urlRows[0]?.label ?? "Tilgangs-URL";

    return {
      actionButton: (
        <DistributionDetailActionButton
          uuid={uuid}
          title={title}
          organizationName={organizationName}
          hierarchyLevel={hierarchyLevel}
          seriesType={seriesType}
          accessState={accessState}
          group={group}
          formatNames={formatNames}
          urlLabel={firstUrlRowLabel}
          thematicSeriesDownloadItem={thematicSeriesDownloadItem}
          downloadableSeriesMembers={downloadableSeriesMembers}
        />
      ),
      title: group.protocolName ?? "Ukjent protokoll",
      content: (
        <FieldList
          fields={[
            { label: "Beskrivelse", content: group.protocolDescription },
            ...urlRows.map(
              (row): Field => ({
                label: row.label,
                content: (
                  <UrlLink
                    url={row.url}
                    protocol={group.protocol}
                    protocolName={group.protocolName}
                    format={row.formatNames.join(", ")}
                    urlLabel={row.label}
                  />
                ),
              }),
            ),
            {
              label: "Formater",
              content: (
                <span className={styles.tags} data-color="info">
                  {/* Filtering unique format names, to avoid duplicate Tags with same text */}
                  {formatNames.map((name) => (
                    <span className="ds-tag" key={name}>
                      {name}
                    </span>
                  ))}
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
                      <span className={styles.tags}>
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
                <span className={styles.tags}>
                  {referenceSystems.map((rs) => (
                    <span
                      className="ds-tag"
                      key={rs.codeSpace ?? rs.code}
                      title={rs.code ?? undefined}
                    >
                      {rs.title || rs.code}
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
  const hasOwnGeonorgeDownloadGroup = groups.some((group) =>
    isGeonorgeDownloadProtocol(group.protocol),
  );

  if (downloadableSeriesMembers.length === 0 || hasOwnGeonorgeDownloadGroup) {
    return groupDetails;
  }

  return [
    ...groupDetails,
    {
      actionButton: (
        <AddToDownloadsButton
          trackingItem={{ uuid, name: title }}
          items={downloadableSeriesMembers}
          size="sm"
          variant="secondary"
          location={LOCATIONS.MetadataPageTabs}
          preventAccordionToggle
        />
      ),
      title: "Geonorge nedlasting",
      content: (
        <FieldList
          fields={[
            {
              label: "Beskrivelse",
              content: `Last ned alle ${downloadableSeriesMembers.length} tilgjengelige filer i serien.`,
            },
          ]}
        />
      ),
    },
  ];
}

type UrlRow = {
  label: string;
  url: string;
  formatNames: string[];
};
function getGroupFormatNames(entries: DistributionGroup["entries"]): string[] {
  return [...new Set(entries.flatMap((entry) => entry.formatNames))];
}

function buildUrlRows(entries: DistributionGroup["entries"]): UrlRow[] {
  const isSingleUrl = entries.length === 1;

  return entries.map((entry) => ({
    label:
      isSingleUrl || entry.formatNames.length === 0
        ? "Tilgangs-URL"
        : entry.formatNames.join(", "),
    url: entry.url,
    formatNames: entry.formatNames,
  }));
}

type Field = { label: string; content: React.ReactNode };

function FieldList({ fields }: { fields: Field[] }) {
  return (
    <dl className={styles.fieldList}>
      {fields.map((f, i) => {
        const key = `${i}-${f.label}`;
        return (
          <div className={styles.fieldRow} key={key}>
            <dt className={styles.fieldLabel}>{f.label}</dt>
            <dd className={styles.fieldValue}>{f.content}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function UrlLink({
  url,
  protocol,
  protocolName,
  format,
  urlLabel,
}: {
  url: string;
  protocol: string | null;
  protocolName: string | null;
  format: string;
  urlLabel: string;
}) {
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
      <CopyButton
        url={url}
        className={styles.copyButton}
        eventName="copy-distribution-link-from-accordion-content"
        trackingProperties={{
          protocol,
          protocolName,
          format,
          urlLabel,
        }}
      />
    </div>
  );
}
