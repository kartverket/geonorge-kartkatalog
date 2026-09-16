"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  isItemInMap,
  MAP_ITEMS_CHANGED_EVENT,
  MAP_ITEMS_KEY,
  type MapItem,
  readMapItems,
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

function getMapItemsSnapshot() {
  return JSON.stringify(readMapItems());
}

function getServerMapItemsSnapshot() {
  return "[]";
}

export function useMapItems(): MapItem[] {
  const serializedItems = useSyncExternalStore(
    subscribeToMap,
    getMapItemsSnapshot,
    getServerMapItemsSnapshot,
  );

  return useMemo(
    () => JSON.parse(serializedItems) as MapItem[],
    [serializedItems],
  );
}

export function useIsItemInMap(uuid: string | null | undefined): boolean {
  return useSyncExternalStore(
    subscribeToMap,
    () => (uuid ? isItemInMap(uuid) : false),
    getServerSnapshot,
  );
}
