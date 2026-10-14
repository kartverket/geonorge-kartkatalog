import { getMetadata } from "@/app/api";
import { Dekningskart } from "./Dekningskart";
import { shouldShowCoverageMap } from "./utils";
import Breadcrumbs from "@/app/_components/Breadcrumbs/Breadcrumbs";
import styles from "./page.module.css";

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
      <Dekningskart metadata={metadata} />
    </div>
  );
}
