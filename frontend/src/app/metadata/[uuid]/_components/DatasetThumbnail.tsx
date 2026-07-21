import Image from "next/image";
import styles from "./DatasetThumbnail.module.css";

export function DatasetThumbnail({ thumbnailUrl }: { thumbnailUrl?: string }) {
  if (!thumbnailUrl) return null;
  return (
    <div className={styles.wrapper}>
      <Image
        src={thumbnailUrl}
        alt="Kartforhåndsvisning"
        width={345}
        height={294}
        className={styles.image}
      />
    </div>
  );
}
