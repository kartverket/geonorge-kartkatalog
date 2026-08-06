import { DatasetCard } from "@/app/_components/DatasetCard/DatasetCard";
import type {
  LinkedDistribution,
  LinkedDistributions,
} from "@/lib/schemas/product";
import styles from "./LinkedDistributionsSection.module.css";

function toDatasetCardProps(d: LinkedDistribution) {
  return {
    uuid: d.uuid,
    title: d.title ?? "-",
    organization: d.organization ?? undefined,
    typeTranslated: d.typeTranslated ?? undefined,
    thumbnailUrl: d.thumbnailUrl ?? undefined,
    distributionUrl: d.distributionUrl ?? undefined,
    distributionProtocol: d.distributionProtocol ?? undefined,
    getCapabilitiesUrl: d.getCapabilitiesUrl ?? undefined,
    showMapLink: d.showMapLink,
    mapCapabilitiesUrl: d.mapCapabilitiesUrl ?? undefined,
  };
}

export function LinkedDistributionsSection({
  linkedDistributions,
}: {
  linkedDistributions: LinkedDistributions;
}) {
  const all = [
    ...linkedDistributions.applications,
    ...linkedDistributions.viewServices,
    ...linkedDistributions.downloadServices,
  ];

  if (all.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>Koblede distribusjoner</h3>
      <div className={styles.cardGrid}>
        {all.map((d) => (
          <DatasetCard key={d.uuid} {...toDatasetCardProps(d)} />
        ))}
      </div>
    </div>
  );
}
