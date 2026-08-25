import searchResult from "../mocks/searchResult.json";
import { SearchHero } from "./_components/SearchHero/SearchHero";
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
    accessState: r.AccessIsRestricted
      ? ("restricted" as const)
      : r.AccessIsProtected
        ? ("protected" as const)
        : ("open" as const),
  }));

  return (
    <>
      <SearchHero />
      <SearchResults results={results} numFound={searchResult.NumFound} />
    </>
  );
}
