"use client";

import { useSyncExternalStore } from "react";
import {
  areAnyItemsInCart,
  DOWNLOAD_ITEMS_CHANGED_EVENT,
  type DownloadItem,
  isItemInCart,
  ORDER_ITEMS_KEY,
} from "@/app/_components/addToCart/cartStorage";

function subscribeToCart(onCartChange: () => void) {
  // Two listeners for two disjoint cases. The custom event never leaves the tab
  // that dispatched it, so it only covers changes made HERE. The storage event
  // is the opposite: the browser fires it on every OTHER tab on this origin,
  // never on the one that did the write.
  //
  // Filter on the key, because adding a whole series writes one event per
  // member and `orderItems` is the only key the snapshots read. A null key is
  // the spec's signal that another tab called localStorage.clear().
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === ORDER_ITEMS_KEY) onCartChange();
  };

  document.addEventListener(DOWNLOAD_ITEMS_CHANGED_EVENT, onCartChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    document.removeEventListener(DOWNLOAD_ITEMS_CHANGED_EVENT, onCartChange);
    window.removeEventListener("storage", handleStorage);
  };
}

// The cart lives in localStorage, which is unavailable while server rendering.
function getServerSnapshot() {
  return false;
}

export function useIsItemInCart(uuid: string | null | undefined): boolean {
  return useSyncExternalStore(
    subscribeToCart,
    () => (uuid ? isItemInCart(uuid) : false),
    getServerSnapshot,
  );
}

export function useAreAnyItemsInCart(items: DownloadItem[]): boolean {
  return useSyncExternalStore(
    subscribeToCart,
    () => areAnyItemsInCart(items),
    getServerSnapshot,
  );
}
