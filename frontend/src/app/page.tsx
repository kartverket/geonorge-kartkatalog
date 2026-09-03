import { SearchHero } from "./_components/SearchHero/SearchHero";
import { SearchResults } from "./_components/SearchResults/SearchResults";
import { getSearchResults } from "./api";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    text?: string;
    offset?: string;
    limit?: string;
    orderby?: string;
  }>;
}) {
  const { text, offset, limit, orderby } = await searchParams;
  const searchResult = await getSearchResults({
    text,
    offset: Number(offset) || 1,
    limit: Number(limit) || 25,
    orderby: orderby || "score",
  });

  const results = searchResult.results.map((r) => ({
    uuid: r.uuid,
    title: r.title,
    organization: r.organization ?? undefined,
    typeTranslated: r.typeTranslated ?? undefined,
    thumbnailUrl: r.thumbnailUrl ?? undefined,
    distributionUrl: r.distributionUrl ?? undefined,
    distributionProtocol: r.distributionProtocol ?? undefined,
    getCapabilitiesUrl: r.getCapabilitiesUrl ?? undefined,
    showMapLink: r.showMapLink,
    mapCapabilitiesUrl:
      r.datasetServicesWithShowMapLink[0]?.getCapabilitiesUrl ??
      r.serviceDistributionUrlForDataset ??
      undefined,
    accessState: r.accessIsRestricted
      ? ("restricted" as const)
      : r.accessIsProtected
        ? ("protected" as const)
        : r.accessIsOpenData === false &&
            !r.accessIsRestricted &&
            !r.accessIsProtected
          ? null
          : ("open" as const),
    hierarchyLevel: r.type,
  }));

  return (
    <>
      <SearchHero initialValue={text ?? ""} />
      <SearchResults results={results} numFound={searchResult.numFound} />
    </>
  );
}
