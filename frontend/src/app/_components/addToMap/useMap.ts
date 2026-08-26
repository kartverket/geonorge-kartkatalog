"use client";

import { useSyncExternalStore } from "react";
import {
  isItemInMap,
  MAP_ITEMS_CHANGED_EVENT,
  MAP_ITEMS_KEY,
} from "@/app/_components/addToMap/mapStorage";

function subscribeToMap(onMapChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === MAP_ITEMS_KEY) onMapChange();
  };

  document.addEventListener(MAP_ITEMS_CHANGED_EVENT, onMapChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    document.removeEventListener(MAP_ITEMS_CHANGED_EVENT, onMapChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerSnapshot() {
  return false;
}

export function useIsItemInMap(uuid: string | null | undefined): boolean {
  return useSyncExternalStore(
    subscribeToMap,
    () => (uuid ? isItemInMap(uuid) : false),
    getServerSnapshot,
  );
}
