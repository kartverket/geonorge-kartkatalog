import { Suspense } from "react";
import {
  getFairStatus,
  type getMetadata,
  getProduktark,
  getProduktspesifikasjon,
  getTegneregler,
} from "@/app/api";
import { DistributionTabSkeleton } from "@/app/metadata/[uuid]/_components/Skeletons";
import { TabPanel } from "@/app/metadata/[uuid]/_components/shared/TabPanel";
import { DistributionTab } from "@/app/metadata/[uuid]/_components/tabs/DistributionTab";
import { FairTab } from "@/app/metadata/[uuid]/_components/tabs/FairTab";
import { InfoTab } from "@/app/metadata/[uuid]/_components/tabs/InfoTab";
import { ProductDocumentationTab } from "@/app/metadata/[uuid]/_components/tabs/ProductDocumentationTab";
import {
  ProductTabs,
  type TabDefinition,
} from "@/app/metadata/[uuid]/_components/tabs/ProductTabs";
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
  linkedDistributions: Promise<LinkedDistributions>;
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
      <Suspense
        fallback={
          <TabPanel value="distribution">
            <DistributionTabSkeleton />
          </TabPanel>
        }
      >
        <DistributionTab
          uuid={uuid}
          metadata={metadata}
          linkedDistributions={linkedDistributions}
        />
      </Suspense>
      {/*TODO: kan vi også her bare ta inn metadata for å forenkle?*/}
      <InfoTab
        hierarchyLevel={metadata.hierarchyLevel}
        abstract={metadata.abstractText}
        specificUsage={metadata.specificUsage}
        purpose={metadata.purpose}
        processHistory={metadata.processHistory}
        supplementalDescription={metadata.supplementalDescription}
        helpUrl={metadata.helpUrl}
        datePublished={metadata.datePublished}
        dateUpdated={metadata.dateUpdated}
        dateMetadataUpdated={metadata.dateMetadataUpdated}
        validityPeriod={metadata.validityPeriod}
        geographicAreas={metadata.geographicAreas}
        boundingBox={metadata.boundingBox}
        cloudCoverPercentage={metadata.cloudCoverPercentage}
        collaborationAndLaws={metadata.collaborationAndLaws}
        datasetLanguage={metadata.datasetLanguage}
        namespace={metadata.namespace}
        datasetId={metadata.datasetId}
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
