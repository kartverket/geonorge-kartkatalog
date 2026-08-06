import Image from "next/image";
import styles from "./ProductThumbnail.module.css";

function isConfiguredThumbnailUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname === "editor.geonorge.no" &&
      parsedUrl.pathname.startsWith("/thumbnails/")
    );
  } catch {
    return false;
  }
}

export function ProductThumbnail({
  thumbnailUrl,
}: {
  thumbnailUrl: string | null;
}) {
  if (!thumbnailUrl || !isConfiguredThumbnailUrl(thumbnailUrl)) return null;
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
