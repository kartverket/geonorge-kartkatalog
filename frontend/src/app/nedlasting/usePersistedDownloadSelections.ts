"use client";

import { useEffect, useState } from "react";
import type { DownloadAreaBlock, DownloadSelection } from "./downloadUtils";

const STORAGE_KEY = "downloadSelections";

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isDownloadAreaBlock(value: unknown): value is DownloadAreaBlock {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.areaCode === null || typeof candidate.areaCode === "string") &&
    isStringArray(candidate.projectionCodes) &&
    isStringArray(candidate.formatNames)
  );
}

function isDownloadSelection(value: unknown): value is DownloadSelection {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.areaBlocks) &&
    candidate.areaBlocks.every(isDownloadAreaBlock)
  );
}

function readStoredSelections(): Record<string, DownloadSelection> {
  if (typeof window === "undefined") return {};

  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) || "{}",
    );

    if (typeof parsed !== "object" || parsed === null) return {};

    const validSelections: Record<string, DownloadSelection> = {};
    for (const [uuid, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (isDownloadSelection(value)) {
        validSelections[uuid] = value;
      }
    }

    return validSelections;
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
