import type { DownloadItem } from "@/app/_components/addToDownloads/downloadStorage";

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
  seriesType: string | null;
  // Satt når datasettet er medlem av en tematisk serie. Medlemmet gir samme fil
  // som serien, så nedlasting skal legge til serien i stedet.
  thematicSeriesDownloadItem: DownloadItem | null;
  fileDownloadUrl: string | null;
};
