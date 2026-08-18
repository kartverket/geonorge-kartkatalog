import { ProductMetadata } from "@/lib/schemas/product";

const EDITOR_BASE_URL = process.env.EDITOR_BASE_URL;
const GEONETWORK_BASE_URL = process.env.GEONETWORK_BASE_URL;
export const getEditUrl = (id: string) =>
  `${EDITOR_BASE_URL}/Metadata/Edit?uuid=${id}`;

export const getMetadataXmlUrl = (id: string) =>
  `${GEONETWORK_BASE_URL}/srv/nor/csw?service=CSW&request=GetRecordById&version=2.0.2&outputSchema=http://www.isotc211.org/2005/gmd&elementSetName=full&id=${id}`;

export const getGeonorgeDownloadUrl = (metadata: ProductMetadata) => {
  const group = metadata.distributionGroups.find(
    (g) => g.protocol === "GEONORGE:DOWNLOAD",
  );
  const rawUrl = group?.formats[0]?.urls[0];
  if (!rawUrl) return null;
  const stripped = rawUrl.replace(/\/+$/, "");
  const lastSlash = stripped.lastIndexOf("/");
  return lastSlash !== -1 ? stripped.substring(0, lastSlash + 1) : rawUrl;
};
