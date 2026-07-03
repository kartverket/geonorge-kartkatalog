import searchResult from "../mocks/searchResult.json";
import { SearchResults } from "./_components/SearchResults/SearchResults";

export default function Home() {
  const results = searchResult.Results.map((r) => ({
    uuid: r.Uuid,
    title: r.Title,
    organization: r.Organization,
    typeTranslated: r.TypeTranslated,
    thumbnailUrl: r.ThumbnailUrl,
    distributionUrl: r.DistributionUrl,
    distributionProtocol: r.DistributionProtocol,
    getCapabilitiesUrl: r.GetCapabilitiesUrl,
    showMapLink: r.ShowMapLink,
    mapCapabilitiesUrl:
      r.DatasetServicesWithShowMapLink?.[0]?.GetCapabilitiesUrl,
  }));

  return <SearchResults results={results} numFound={searchResult.NumFound} />;
}
