const COPYABLE_DISTRIBUTION_PROTOCOLS = new Set([
  "W3C:REST",
  "OGC:WMS",
  "OGC:WFS",
  "OGC:WCS",
  "OGC:API-Features",
  "OGC:API-Tiles",
  "OPENDAP:OPENDAP",
  "OGC:WMTS",
  "OGC:CSW",
  "OGC:API-Coverages",
  "OGC:OAPIF",
  "W3C:WS",
]);

export const DISTRIBUTION_PROTOCOLS = {
  directDownloadPage: "WWW:DOWNLOAD-1.0-http--download",
  geonorgeDownload: "GEONORGE:DOWNLOAD",
  wms: "OGC:WMS",
} as const;

export function isCopyableDistributionProtocol(protocol: string | null): boolean {
  return protocol != null && COPYABLE_DISTRIBUTION_PROTOCOLS.has(protocol);
}

export function isDirectDownloadPageProtocol(protocol: string | null): boolean {
  return protocol === DISTRIBUTION_PROTOCOLS.directDownloadPage;
}

export function isGeonorgeDownloadProtocol(protocol: string | null): boolean {
  return protocol === DISTRIBUTION_PROTOCOLS.geonorgeDownload;
}

export function isWmsDistributionProtocol(protocol: string | null): boolean {
  return protocol === DISTRIBUTION_PROTOCOLS.wms;
}

