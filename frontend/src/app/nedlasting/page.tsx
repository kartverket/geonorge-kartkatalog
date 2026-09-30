import Link from "next/link";
import { Suspense } from "react";
import { DownloadPageContent } from "./DownloadPageContent";
import styles from "./page.module.css";

export default function NedlastingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <nav aria-label={"Brødsmulesti"} className={styles.breadcrumb}>
          <a href="/">Geonorge</a> {"›"} <Link href="/">Kartkatalogen</Link>{" "}
          {"›"} <span>Filnedlasting</span>
        </nav>
        <Suspense fallback={null}>
          <DownloadPageContent />
        </Suspense>
      </div>
    </main>
  );
}
