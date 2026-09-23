import Link from "next/link";
import {getDownloadInsightGroups} from "@/app/api";
import { isBeta } from "@/lib/basePath";
import { DownloadPageContent } from "./DownloadPageContent";
import styles from "./page.module.css";

export default async function NedlastingPage() {
  if (isBeta) {
    return null;
  }

  const insightGroups = await getDownloadInsightGroups();

  return (
    <main className={styles.page} data-color="neutral">
      <div className={styles.content}>
        <nav aria-label={"Brødsmulesti"} className={styles.breadcrumb}>
          <a href="/">Geonorge</a> {"›"} <Link href="/">Kartkatalogen</Link>{" "}
          {"›"} <span>Filnedlasting</span>
        </nav>
        <DownloadPageContent insightGroups={insightGroups} />
      </div>
    </main>
  );
}
