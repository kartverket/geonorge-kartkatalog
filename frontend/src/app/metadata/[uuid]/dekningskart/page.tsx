import Breadcrumbs from "@/app/_components/Breadcrumbs/Breadcrumbs";
import { getCoverageData, getKommunerByNummer, getMetadata } from "@/app/api";
import { Dekningskart } from "./Dekningskart";
import styles from "./page.module.css";
import { shouldShowCoverageMap } from "./utils";

export const instant = false;
export default async function DekningskartPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const uuid = (await params).uuid;
  const metadata = await getMetadata(uuid);
  if (!shouldShowCoverageMap(metadata)) {
    return <p>No coverage available</p>;
  }
  const coverageCompletenessUrl =
    metadata.coverageData?.completenessCoverageData?.type === "GEOJSON" &&
    metadata.coverageData?.completenessCoverageData?.url;
  const [kommunerByNummer, completenessData] = await Promise.all([
    getKommunerByNummer(),
    coverageCompletenessUrl
      ? getCoverageData(coverageCompletenessUrl)
      : Promise.resolve(null),
  ]);

  return (
    <div className={styles.dekningskartPage}>
      <div className={styles.breadcrumbContainer}>
        <Breadcrumbs
          segments={[
            { label: "Geonorge", href: "" },
            { label: "Kartkatalogen", href: "" },
            {
              label: metadata.title ?? "-",
              href: `metadata/${uuid}`,
            },
            { label: "Dekningskart" },
          ]}
        />
      </div>
      <Dekningskart
        metadata={metadata}
        kommunerByNummer={kommunerByNummer}
        completenessDataString={completenessData}
      />
    </div>
  );
}
