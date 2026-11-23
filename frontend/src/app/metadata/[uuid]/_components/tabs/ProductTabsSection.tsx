import {
  getFairStatus,
  type getMetadata,
  getProduktark,
  getProduktspesifikasjon,
  getTegneregler,
} from "@/app/api";
import { DistributionTab } from "@/app/metadata/[uuid]/_components/tabs/DistributionTab";
import { FairTab } from "@/app/metadata/[uuid]/_components/tabs/FairTab";
import { InfoTab } from "@/app/metadata/[uuid]/_components/tabs/InfoTab";
import { ProductDocumentationTab } from "@/app/metadata/[uuid]/_components/tabs/ProductDocumentationTab";
import {
  ProductTabs,
  type TabDefinition,
} from "@/app/metadata/[uuid]/_components/tabs/ProductTabs";
import {
  getDownloadableSeriesMembers,
  getThematicParentSeriesDownloadItem,
} from "@/app/metadata/[uuid]/_utils/distributions";
import { hasDocumentation } from "@/app/metadata/[uuid]/_utils/productPage";
import { unwrapSettled } from "@/app/metadata/[uuid]/_utils/utils";
import { getProductTypeDefiniteString } from "@/lib/productType";
import type { LinkedDistributions } from "@/lib/schemas/product";

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

  const isThematicSeries =
    metadata.hierarchyLevel === "series" &&
    metadata.seriesType === "series_thematic";

  const productTypeDefinite = getProductTypeDefiniteString(
    metadata.hierarchyLevel,
  );
  const showDocumentation = hasDocumentation({
    tegneregler,
    produktark,
    produktspesifikasjon,
  });

  const tabs: TabDefinition[] = [
    {
      value: "distribution",
      label: `Distribusjoner for ${productTypeDefinite}`,
    },
    { value: "info", label: `Informasjon om ${productTypeDefinite}` },
    ...(showDocumentation
      ? [{ value: "documentation", label: "Dokumentasjon" }]
      : []),
    ...(fairStatus
      ? [{ value: "quality", label: "Metadatakvalitet (FAIR)" }]
      : []),
  ];

  return (
    <ProductTabs tabs={tabs}>
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
      <InfoTab
        hierarchyLevel={metadata.hierarchyLevel}
        abstract={metadata.abstractText}
        specificUsage={metadata.specificUsage}
        purpose={metadata.purpose}
        processHistory={metadata.processHistory}
        supplementalDescription={metadata.supplementalDescription}
        helpUrl={metadata.helpUrl}
        constraints={{
          ...metadata.constraints,
          securityConstraints: metadata.securityClassification,
        }}
      />
      {showDocumentation && (
        <ProductDocumentationTab
          tegneregler={tegneregler}
          produktark={produktark}
          produktspesifikasjon={produktspesifikasjon}
        />
      )}
      {fairStatus && <FairTab fairStatus={fairStatus} />}
    </ProductTabs>
  );
}
