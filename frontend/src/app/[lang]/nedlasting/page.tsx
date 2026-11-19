import Link from "next/link";
import { Suspense } from "react";
import { localizedPath } from "@/lib/i18n";
import { getLocale } from "../dictionaries";
import { DownloadPageContent } from "./DownloadPageContent";
import styles from "./page.module.css";

export default async function NedlastingPage() {
  const locale = await getLocale();
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <nav aria-label={"Brødsmulesti"} className={styles.breadcrumb}>
          <a href="/">Geonorge</a> {"›"}{" "}
          <Link href={localizedPath(locale, "/")}>Kartkatalogen</Link> {"›"}{" "}
          <span>Filnedlasting</span>
        </nav>
        <Suspense fallback={null}>
          <DownloadPageContent />
        </Suspense>
      </div>
    </main>
  );
}
