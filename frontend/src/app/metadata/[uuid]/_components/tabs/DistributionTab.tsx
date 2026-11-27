import { Heading } from "@kv-designsystem/react";
import AddToDownloadsButton from "@/app/_components/addToDownloads/AddToDownloadsButton";
import type { DownloadItem } from "@/app/_components/addToDownloads/downloadStorage";
import type { getMetadata } from "@/app/api";
import { DistributionDetailActionButton } from "@/app/metadata/[uuid]/_components/DistributionDetailActionButton";
import { LinkedDistributionsSection } from "@/app/metadata/[uuid]/_components/LinkedDistributionsSection";
import accordionGroupStyles from "@/app/metadata/[uuid]/_components/shared/AccordionGroup.module.css";
import { DetailAccordion } from "@/app/metadata/[uuid]/_components/shared/DetailAccordion";
import { FieldList } from "@/app/metadata/[uuid]/_components/shared/FieldList";
import { TabPanel } from "@/app/metadata/[uuid]/_components/shared/TabPanel";
import { UrlLink } from "@/app/metadata/[uuid]/_components/shared/UrlLink";
import { isGeonorgeDownloadProtocol } from "@/app/metadata/[uuid]/_utils/distributionProtocols";
import {
  buildUrlRows,
  getDownloadableSeriesMembers,
  getGroupFormatNames,
  getThematicParentSeriesDownloadItem,
} from "@/app/metadata/[uuid]/_utils/distributions";
import { hasVisibleFields } from "@/app/metadata/[uuid]/_utils/tableContent";
import { formatDate } from "@/app/metadata/[uuid]/_utils/utils";
import { getProductTypeDefiniteString } from "@/lib/productType";
import type {
  DistributionGroup,
  LinkedDistributions,
  ReferenceSystem,
} from "@/lib/schemas/product";
import { LOCATIONS } from "@/posthog/posthog";
import styles from "./DistributionTab.module.css";

type ProductInfo = {
  uuid: string;
  title: string;
  organizationName: string | null;
  hierarchyLevel: string | null;
  seriesType: string | null;
  accessState: "restricted" | "open" | "protected" | null;
  referenceSystems: ReferenceSystem[];
  dateUpdated: string | null;
  maintenanceFrequency: string | null;
};

type SeriesDownloads = {
  thematicSeriesDownloadItem: DownloadItem | null;
  downloadableSeriesMembers: DownloadItem[];
};

export async function DistributionTab({
  uuid,
  metadata,
  linkedDistributions: linkedDistributionsPromise,
}: {
  uuid: string;
  metadata: Awaited<ReturnType<typeof getMetadata>>;
  linkedDistributions: Promise<LinkedDistributions>;
}) {
  const linkedDistributions = await linkedDistributionsPromise;
  const product: ProductInfo = {
    uuid,
    title: metadata.title,
    organizationName: metadata.organization,
    hierarchyLevel: metadata.hierarchyLevel,
    seriesType: metadata.seriesType,
    accessState: metadata.accessState,
    referenceSystems: metadata.referenceSystems,
    dateUpdated: metadata.dateUpdated,
    maintenanceFrequency: metadata.maintenanceFrequency,
  };
  const isThematicSeries =
    metadata.hierarchyLevel === "series" &&
    metadata.seriesType === "series_thematic";
  const seriesDownloads: SeriesDownloads = {
    thematicSeriesDownloadItem:
      getThematicParentSeriesDownloadItem(linkedDistributions),
    downloadableSeriesMembers: isThematicSeries
      ? []
      : getDownloadableSeriesMembers(linkedDistributions),
  };

  const groups = metadata.distributionGroups;
  const visibleGroups = groups
    .map((group) => getGroupContent(product, group))
    .filter((content) => hasVisibleFields(content.fields));
  const showSeriesDownload =
    !groups.some((group) => isGeonorgeDownloadProtocol(group.protocol)) &&
    seriesDownloads.downloadableSeriesMembers.length > 0;
  const hasAccess = visibleGroups.length > 0 || showSeriesDownload;

  return (
    <TabPanel value="distribution">
      {hasAccess && (
        <>
          <Heading data-size="xs">
            Tilganger til {getProductTypeDefiniteString(product.hierarchyLevel)}
          </Heading>
          <div className={accordionGroupStyles.accordionGroup}>
            {visibleGroups.map((content, i) => {
              const key = `${i}-${content.group.protocolName}`;
              return (
                <DistributionGroupAccordion
                  key={key}
                  product={product}
                  content={content}
                  seriesDownloads={seriesDownloads}
                />
              );
            })}
            {showSeriesDownload && (
              <SeriesDownloadAccordion
                uuid={product.uuid}
                title={product.title}
                items={seriesDownloads.downloadableSeriesMembers}
              />
            )}
          </div>
        </>
      )}
      <LinkedDistributionsSection linkedDistributions={linkedDistributions} />
    </TabPanel>
  );
}

type GroupContent = ReturnType<typeof getGroupContent>;

function getGroupContent(product: ProductInfo, group: DistributionGroup) {
  const urlRows = buildUrlRows(group.entries);
  const formatNames = getGroupFormatNames(group.entries);
  const units = group.unitsOfDistribution
    ?.split(",")
    .map((unit) => unit.trim())
    .filter(Boolean);

  const fields = [
    { label: "Beskrivelse", content: group.protocolDescription },
    ...urlRows.map((row) => ({
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
    })),
    {
      label: "Formater",
      content: formatNames.length > 0 && (
        <Tags values={formatNames} color="info" />
      ),
    },
    {
      label: "Oppdateringsfrekvens",
      content: product.maintenanceFrequency,
    },
    {
      label: "Ressurs sist oppdatert",
      content: product.dateUpdated && formatDate(product.dateUpdated),
    },
    {
      label: "Geografisk distribusjonsinndeling",
      content: units && units.length > 0 && <Tags values={units} />,
    },
    {
      label: "Referansesystem",
      content: product.referenceSystems.length > 0 && (
        <span className={styles.tags}>
          {product.referenceSystems.map((rs, i) => (
            <span
              className="ds-tag"
              key={rs.code ?? i}
              title={rs.code ?? undefined}
            >
              {rs.title || rs.code}
            </span>
          ))}
        </span>
      ),
    },
  ];

  return { group, urlRows, formatNames, fields };
}

function DistributionGroupAccordion({
  product,
  content: { group, urlRows, formatNames, fields },
  seriesDownloads,
}: {
  product: ProductInfo;
  content: GroupContent;
  seriesDownloads: SeriesDownloads;
}) {
  return (
    <DetailAccordion
      title={group.protocolName ?? "Ukjent protokoll"}
      actionButton={
        <DistributionDetailActionButton
          uuid={product.uuid}
          title={product.title}
          organizationName={product.organizationName}
          hierarchyLevel={product.hierarchyLevel}
          seriesType={product.seriesType}
          accessState={product.accessState}
          group={group}
          formatNames={formatNames}
          urlLabel={urlRows[0]?.label ?? "Tilgangs-URL"}
          thematicSeriesDownloadItem={
            seriesDownloads.thematicSeriesDownloadItem
          }
          downloadableSeriesMembers={seriesDownloads.downloadableSeriesMembers}
        />
      }
    >
      <FieldList fields={fields} />
    </DetailAccordion>
  );
}

function SeriesDownloadAccordion({
  uuid,
  title,
  items,
}: {
  uuid: string;
  title: string;
  items: DownloadItem[];
}) {
  return (
    <DetailAccordion
      title="Geonorge nedlasting"
      actionButton={
        <AddToDownloadsButton
          trackingItem={{ uuid, name: title }}
          items={items}
          size="sm"
          variant="secondary"
          location={LOCATIONS.MetadataPageTabs}
          preventAccordionToggle
        />
      }
    >
      <FieldList
        fields={[
          {
            label: "Beskrivelse",
            content: `Last ned alle ${items.length} tilgjengelige filer i serien.`,
          },
        ]}
      />
    </DetailAccordion>
  );
}

function Tags({ values, color }: { values: string[]; color?: string }) {
  return (
    <span className={styles.tags} data-color={color}>
      {values.map((value) => (
        <span className="ds-tag" key={value}>
          {value}
        </span>
      ))}
    </span>
  );
}
