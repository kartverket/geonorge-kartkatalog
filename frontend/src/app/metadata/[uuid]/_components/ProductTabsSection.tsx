import {
  getFairStatus,
  getLinkedDistributions,
  type getMetadata,
  getProduktark,
  getTegneregler,
} from "@/app/api";
import { ProductTabs } from "@/app/metadata/[uuid]/_components/ProductTabs";

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

  if (fairStatusResult.status === "rejected") {
    console.error("Kunne ikke laste FAIR-status", fairStatusResult.reason);
  }
  if (tegnereglerResult.status === "rejected") {
    console.error("Kunne ikke laste tegneregler", tegnereglerResult.reason);
  }
  if (produktarkResult.status === "rejected") {
    console.error("Kunne ikke laste produktark", produktarkResult.reason);
  }
  if (linkedDistributionsResult.status === "rejected") {
    console.error(
      "Kunne ikke laste koblede distribusjoner",
      linkedDistributionsResult.reason,
    );
  }

  const fairStatus =
    fairStatusResult.status === "fulfilled" ? fairStatusResult.value : null;
  const tegneregler =
    tegnereglerResult.status === "fulfilled" ? tegnereglerResult.value : null;
  const produktark =
    produktarkResult.status === "fulfilled" ? produktarkResult.value : null;
  const linkedDistributions =
    linkedDistributionsResult.status === "fulfilled"
      ? linkedDistributionsResult.value
      : {
          applications: [],
          viewServices: [],
          downloadServices: [],
          seriesMembers: [],
          parentSeries: [],
          relatedDatasets: [],
          serviceLayers: [],
          parentService: [],
        };

  return (
    <ProductTabs
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
      referenceSystems={metadata.referenceSystems}
      distributionGroups={metadata.distributionGroups}
      linkedDistributions={linkedDistributions}
      dateUpdated={metadata.dateUpdated}
      maintenanceFrequency={metadata.maintenanceFrequency}
      fairStatus={fairStatus}
      tegneregler={tegneregler}
      produktark={produktark}
    />
  );
}
