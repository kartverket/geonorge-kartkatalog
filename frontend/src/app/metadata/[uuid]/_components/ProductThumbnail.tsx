import Image from "next/image";
import styles from "./ProductThumbnail.module.css";

export function ProductThumbnail({
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
        width={1}
        height={1}
        unoptimized={false}
        loading="eager"
        sizes="(max-width: 768px) 100vw, 345px"
        className={styles.image}
      />
    </div>
  );
}
