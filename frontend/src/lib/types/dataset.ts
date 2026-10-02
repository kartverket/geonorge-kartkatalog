export type DatasetCardData = {
  uuid: string;
  title: string;
  organization: string | null;
  typeTranslated: string | null;
  thumbnailUrl: string | null;
  distributionUrl: string | null;
  distributionProtocol: string | null;
  getCapabilitiesUrl: string | null;
  showMapLink: boolean;
  mapCapabilitiesUrl: string | null;
  accessState: "restricted" | "open" | "protected" | null;
  hierarchyLevel: string | null;
};
