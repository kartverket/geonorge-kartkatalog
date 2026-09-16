import Link from "next/link";
import { isBeta } from "@/lib/basePath";
import { DownloadCartList } from "./DownloadCartList";
import styles from "./page.module.css";

export default function NedlastingPage() {
  if (isBeta) {
    return null;
  }
  return (
    <main className={styles.page} data-color="neutral">
      <div className={styles.content}>
      <nav aria-label={"Brødsmulesti"} className={styles.breadcrumb}>
        <a href="/">Geonorge</a> {"›"} <Link href="/">Kartkatalogen</Link> {"›"}{" "}
        <span>Filnedlasting</span>
      </nav>
      <DownloadCartList />
      </div>
    </main>
  );
}
