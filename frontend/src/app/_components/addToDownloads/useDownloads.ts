"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  DOWNLOAD_ITEMS_CHANGED_EVENT,
  type DownloadItem,
  isItemSelectedForDownload,
  readSelectedDownloadUuids,
  SELECTED_DOWNLOAD_UUIDS_KEY,
} from "@/app/_components/addToDownloads/downloadStorage";

function subscribeToDownloads(onDownloadsChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SELECTED_DOWNLOAD_UUIDS_KEY) {
      onDownloadsChange();
    }
  };

  document.addEventListener(DOWNLOAD_ITEMS_CHANGED_EVENT, onDownloadsChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    document.removeEventListener(
      DOWNLOAD_ITEMS_CHANGED_EVENT,
      onDownloadsChange,
    );
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerSnapshot() {
  return false;
}

function getSelectedDownloadUuidsSnapshot() {
  return JSON.stringify(readSelectedDownloadUuids());
}

function getServerSelectedDownloadUuidsSnapshot() {
  return "[]";
}

export function useSelectedDownloadUuids(): string[] {
  const serializedItems = useSyncExternalStore(
    subscribeToDownloads,
    getSelectedDownloadUuidsSnapshot,
    getServerSelectedDownloadUuidsSnapshot,
  );

  return useMemo(
    () => JSON.parse(serializedItems) as string[],
    [serializedItems],
  );
}

export function useIsItemSelectedForDownload(
  uuid: string | null | undefined,
): boolean {
  return useSyncExternalStore(
    subscribeToDownloads,
    () => (uuid ? isItemSelectedForDownload(uuid) : false),
    getServerSnapshot,
  );
}

export function useAreAllItemsSelectedForDownload(
  items: DownloadItem[],
): boolean {
  return useSyncExternalStore(
    subscribeToDownloads,
    () =>
      items.length > 0 &&
      items.every((item) => isItemSelectedForDownload(item.uuid)),
    getServerSnapshot,
  );
}
