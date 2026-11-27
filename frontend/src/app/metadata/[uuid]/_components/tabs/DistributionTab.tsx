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

// TODO: skjule distribusjoner når den er tom
export function DistributionTab({
  product,
  groups,
  linkedDistributions,
  seriesDownloads,
}: {
  product: ProductInfo;
  groups: DistributionGroup[];
  linkedDistributions: LinkedDistributions;
  seriesDownloads: SeriesDownloads;
}) {
  const productTypeDefinite = getProductTypeDefiniteString(
    product.hierarchyLevel,
  );
  const hasOwnGeonorgeDownloadGroup = groups.some((group) =>
    isGeonorgeDownloadProtocol(group.protocol),
  );

  return (
    <TabPanel value="distribution">
      <Heading data-size="xs">Tilganger til {productTypeDefinite}</Heading>
      <div className={accordionGroupStyles.accordionGroup}>
        {groups.map((group, i) => {
          const key = `${i}-${group.protocolName}`;
          return (
            <DistributionGroupAccordion
              key={key}
              product={product}
              group={group}
              seriesDownloads={seriesDownloads}
            />
          );
        })}
        {!hasOwnGeonorgeDownloadGroup && (
          <SeriesDownloadAccordion
            uuid={product.uuid}
            title={product.title}
            items={seriesDownloads.downloadableSeriesMembers}
          />
        )}
      </div>
      <LinkedDistributionsSection linkedDistributions={linkedDistributions} />
    </TabPanel>
  );
}

function DistributionGroupAccordion({
  product,
  group,
  seriesDownloads,
}: {
  product: ProductInfo;
  group: DistributionGroup;
  seriesDownloads: SeriesDownloads;
}) {
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

  if (!hasVisibleFields(fields)) return null;

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
  if (items.length === 0) return null;

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

// TODO: kunne ikkke denne vært slått sammen med Dist.Tab? og så fjernet dette laget
export async function DistributionsTabWrapper({
  uuid,
  metadata,
  linkedDistributions: linkedDistributionsPromise,
}: {
  uuid: string;
  metadata: Awaited<ReturnType<typeof getMetadata>>;
  linkedDistributions: Promise<LinkedDistributions>;
}) {
  const linkedDistributions = await linkedDistributionsPromise;
  const isThematicSeries =
    metadata.hierarchyLevel === "series" &&
    metadata.seriesType === "series_thematic";

  return (
    <DistributionTab
      product={{
        uuid,
        title: metadata.title,
        organizationName: metadata.organization,
        hierarchyLevel: metadata.hierarchyLevel,
        seriesType: metadata.seriesType,
        accessState: metadata.accessState,
        referenceSystems: metadata.referenceSystems,
        dateUpdated: metadata.dateUpdated,
        maintenanceFrequency: metadata.maintenanceFrequency,
      }}
      groups={metadata.distributionGroups}
      linkedDistributions={linkedDistributions}
      seriesDownloads={{
        thematicSeriesDownloadItem:
          getThematicParentSeriesDownloadItem(linkedDistributions),
        downloadableSeriesMembers: isThematicSeries
          ? []
          : getDownloadableSeriesMembers(linkedDistributions),
      }}
    />
  );
}
