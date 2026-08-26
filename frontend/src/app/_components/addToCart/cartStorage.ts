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

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Kunne ikke lagre "${key}" i localStorage`, error);
    return false;
  }
}

function safeRemoveItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Kunne ikke fjerne "${key}" fra localStorage`, error);
  }
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

export function areAnyItemsInCart(items: DownloadItem[]): boolean {
  const normalizedItems = normalizeDownloadItems(items);

  if (normalizedItems.length === 0) return false;

  const selectedItems = new Set(readOrderItems());
  return normalizedItems.some((item) => selectedItems.has(item.uuid));
}

export function addItemsToCart(items: DownloadItem[]) {
  const normalizedItems = normalizeDownloadItems(items);

  if (normalizedItems.length === 0) return;

  const selectedItems = new Set(readOrderItems());

  for (const item of normalizedItems) {
    // Elementer vi ikke fikk lagret metadata for skal heller ikke inn i
    // indeksen, ellers ender vi opp med en kurv som peker på ingenting.
    if (!safeSetItem(`${item.uuid}.metadata`, JSON.stringify(item))) continue;
    selectedItems.add(item.uuid);
  }

  safeSetItem(ORDER_ITEMS_KEY, JSON.stringify([...selectedItems]));
  // Sendes uansett, slik at knappene leser tilbake det som faktisk ble lagret.
  dispatchDownloadItemsChanged();
}

export function removeItemsFromCart(items: DownloadItem[]) {
  const normalizedItems = normalizeDownloadItems(items);

  if (normalizedItems.length === 0) return;

  const idsToRemove = new Set(normalizedItems.map((item) => item.uuid));
  const remainingItems = readOrderItems().filter((id) => !idsToRemove.has(id));

  for (const item of normalizedItems) {
    safeRemoveItem(`${item.uuid}.metadata`);
  }

  safeSetItem(ORDER_ITEMS_KEY, JSON.stringify(remainingItems));
  dispatchDownloadItemsChanged();
}
