"use client";

import { useEffect, useState } from "react";
import type { DownloadSelection } from "./downloadUtils";

const STORAGE_KEY = "downloadSelections";

function readStoredSelections(): Record<string, DownloadSelection> {
  if (typeof window === "undefined") return {};

  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) || "{}",
    );
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, DownloadSelection>)
      : {};
  } catch {
    return {};
  }
}

export function usePersistedDownloadSelections() {
  const [selections, setSelections] = useState<
    Record<string, DownloadSelection>
  >(() => readStoredSelections());

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    } catch (error) {
      console.error("Kunne ikke lagre nedlastingsvalg", error);
    }
  }, [selections]);

  return [selections, setSelections] as const;
}
