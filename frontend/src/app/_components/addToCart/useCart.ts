"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  areAnyItemsInCart,
  DOWNLOAD_ITEMS_CHANGED_EVENT,
  type DownloadItem,
  isItemInCart,
  ORDER_ITEMS_KEY,
  readOrderItems,
} from "@/app/_components/addToCart/cartStorage";

function subscribeToCart(onCartChange: () => void) {
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

function getServerSnapshot() {
  return false;
}

function getOrderItemsSnapshot() {
  return JSON.stringify(readOrderItems());
}

function getServerOrderItemsSnapshot() {
  return "[]";
}

export function useOrderItems(): string[] {
  const serializedItems = useSyncExternalStore(
    subscribeToCart,
    getOrderItemsSnapshot,
    getServerOrderItemsSnapshot,
  );

  return useMemo(
    () => JSON.parse(serializedItems) as string[],
    [serializedItems],
  );
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

export function useAreAllItemsInCart(items: DownloadItem[]): boolean {
  return useSyncExternalStore(
    subscribeToCart,
    () => items.every((item) => isItemInCart(item.uuid)),
    getServerSnapshot,
  );
}
