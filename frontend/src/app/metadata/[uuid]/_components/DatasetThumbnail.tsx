import Image from "next/image";
import styles from "./DatasetThumbnail.module.css";

export function DatasetThumbnail({
  thumbnailUrl,
}: {
  thumbnailUrl: string | null;
}) {
  if (!thumbnailUrl) return null;
  return (
    <div className={styles.wrapper}>
      <Image
        src={thumbnailUrl}
        alt="Kartforhåndsvisning"
        fill
        loading="eager"
        sizes="(max-width: 768px) 100vw, 345px"
        className={styles.image}
      />
    </div>
  );
}
