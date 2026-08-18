
const EDITOR_BASE_URL = process.env.EDITOR_BASE_URL;
const GEONETWORK_BASE_URL = process.env.GEONETWORK_BASE_URL;
export const getEditUrl = (id: string) =>
  `${EDITOR_BASE_URL}/Metadata/Edit?uuid=${id}`;

export const getMetadataXmlUrl = (id: string) =>
  `${GEONETWORK_BASE_URL}/srv/nor/csw?service=CSW&request=GetRecordById&version=2.0.2&outputSchema=http://www.isotc211.org/2005/gmd&elementSetName=full&id=${id}`;

