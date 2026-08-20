export type DownloadItem = {
  distributionUrl: string | null;
  name: string;
  uuid: string;
};

export const ORDER_ITEMS_KEY = "orderItems";
export const DOWNLOAD_ITEMS_CHANGED_EVENT = "downloadItemsChanged";

type StoredDownloadItem = {
  distributionUrl: string;
  name: string;
  uuid: string;
};

function normalizeDownloadItems(items: DownloadItem[]): StoredDownloadItem[] {
  const uniqueItems = new Map<string, StoredDownloadItem>();

  for (const item of items) {
    if (!item.uuid || !item.distributionUrl) continue;

    uniqueItems.set(item.uuid, {
      uuid: item.uuid,
      name: item.name,
      distributionUrl: item.distributionUrl,
    });
  }

  return [...uniqueItems.values()];
}

function dispatchDownloadItemsChanged() {
  if (typeof document === "undefined") return;
  document.dispatchEvent(new Event(DOWNLOAD_ITEMS_CHANGED_EVENT));
}

export function readOrderItems(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(ORDER_ITEMS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isItemInCart(uuid: string): boolean {
  return readOrderItems().includes(uuid);
}

export function areAllItemsInCart(items: DownloadItem[]): boolean {
  const normalizedItems = normalizeDownloadItems(items);

  if (normalizedItems.length === 0) return false;

  const selectedItems = new Set(readOrderItems());
  return normalizedItems.every((item) => selectedItems.has(item.uuid));
}

export function addItemsToCart(items: DownloadItem[]) {
  const normalizedItems = normalizeDownloadItems(items);

  if (normalizedItems.length === 0) return;

  const selectedItems = new Set(readOrderItems());

  for (const item of normalizedItems) {
    selectedItems.add(item.uuid);
    localStorage.setItem(`${item.uuid}.metadata`, JSON.stringify(item));
  }

  localStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify([...selectedItems]));
  dispatchDownloadItemsChanged();
}

export function removeItemsFromCart(items: DownloadItem[]) {
  const normalizedItems = normalizeDownloadItems(items);

  if (normalizedItems.length === 0) return;

  const idsToRemove = new Set(normalizedItems.map((item) => item.uuid));
  const remainingItems = readOrderItems().filter((id) => !idsToRemove.has(id));

  for (const item of normalizedItems) {
    localStorage.removeItem(`${item.uuid}.metadata`);
  }

  localStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(remainingItems));
  dispatchDownloadItemsChanged();
}
