import type { DownloadItem } from "@/app/_components/addToCart/cartStorage";
import type { MapItem } from "@/app/_components/addToMap/mapStorage";
import type {
  DistributionGroup,
  LinkedDistribution,
  LinkedDistributions,
  ProductMetadata,
} from "@/lib/schemas/product";

type MapSource = {
  uuid: string;
  title: string;
  getCapabilitiesUrl: string;
};

export function getGeonorgeDownloadUrl(
  distributionGroups: DistributionGroup[],
): string | null {
  const group = distributionGroups.find(
    (distributionGroup) => distributionGroup.protocol === "GEONORGE:DOWNLOAD",
  );
  const rawUrl = group?.formats[0]?.urls[0];

  if (!rawUrl) return null;

  const stripped = rawUrl.replace(/\/+$/, "");
  const lastSlash = stripped.lastIndexOf("/");
  return lastSlash !== -1 ? stripped.substring(0, lastSlash + 1) : stripped;
}

export function toDownloadItem(
  distribution: LinkedDistribution,
): DownloadItem | null {
  if (
    distribution.distributionProtocol !== "GEONORGE:DOWNLOAD" ||
    !distribution.distributionUrl
  ) {
    return null;
  }

  return {
    uuid: distribution.uuid,
    name: distribution.title ?? "-",
    distributionUrl: distribution.distributionUrl,
  };
}

export function getDownloadableSeriesMembers(
  linkedDistributions: LinkedDistributions,
): DownloadItem[] {
  return linkedDistributions.seriesMembers.flatMap((distribution) => {
    const downloadItem = toDownloadItem(distribution);
    return downloadItem ? [downloadItem] : [];
  });
}

export function getCartItem(
  metadata: ProductMetadata,
  uuid: string,
): DownloadItem | null {
  if (
    metadata.hierarchyLevel !== "dataset" ||
    metadata.accessState !== "open"
  ) {
    return null;
  }

  return {
    uuid,
    name: metadata.title,
    distributionUrl: getGeonorgeDownloadUrl(metadata.distributionGroups),
  };
}

function getDirectWmsMapSource(
  distributionGroups: DistributionGroup[],
  uuid: string,
  title: string,
): MapSource | null {
  const group = distributionGroups.find(
    (distributionGroup) => distributionGroup.protocol === "OGC:WMS",
  );
  const rawUrl = group?.formats[0]?.urls[0];

  if (!rawUrl) return null;

  return {
    uuid,
    title,
    getCapabilitiesUrl: rawUrl,
  };
}

function getLinkedWmsMapSource(
  linkedDistributions: LinkedDistributions,
): MapSource | null {
  const candidates = [
    ...linkedDistributions.viewServices,
    ...linkedDistributions.parentService,
    ...linkedDistributions.serviceLayers,
  ];

  const firstMatch = candidates.find(
    (distribution) =>
      distribution.distributionProtocol === "OGC:WMS" &&
      distribution.getCapabilitiesUrl,
  );

  if (!firstMatch?.getCapabilitiesUrl) return null;

  return {
    uuid: firstMatch.uuid,
    title: firstMatch.title ?? "-",
    getCapabilitiesUrl: firstMatch.getCapabilitiesUrl,
  };
}

export function getMapItem(
  metadata: ProductMetadata,
  linkedDistributions: LinkedDistributions,
  uuid: string,
): MapItem | null {
  const mapSource =
    getDirectWmsMapSource(metadata.distributionGroups, uuid, metadata.title) ??
    getLinkedWmsMapSource(linkedDistributions);

  if (!mapSource) return null;

  return {
    addLayers: [],
    DistributionProtocol: "OGC:WMS",
    Uuid: mapSource.uuid,
    Title: mapSource.title,
    GetCapabilitiesUrl: mapSource.getCapabilitiesUrl,
  };
}
