import Link from "next/link";
import { connection } from "next/server";
import { getDownloadInsightGroups } from "@/app/api";
import { DownloadPageContent } from "./DownloadPageContent";
import styles from "./page.module.css";

export default async function NedlastingPage() {
  await connection();
  const insightGroups = await getDownloadInsightGroups();

  return (
    <main className={styles.page}>
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
