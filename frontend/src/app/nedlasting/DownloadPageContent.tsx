import { connection } from "next/server";
import { getDownloadInsightGroups } from "@/app/api";
import { DownloadPageContentClient } from "./DownloadPageContentClient";

export async function DownloadPageContent() {
  await connection();
  const insightGroups = await getDownloadInsightGroups();

  return <DownloadPageContentClient insightGroups={insightGroups} />;
}