export type DownloadItem = {
  accessType: string | null;
  distributionUrl: string | null;
  name: string;
  organizationName: string | null;
  uuid: string;
};

// Keep the existing value so previously selected downloads remain available.
export const SELECTED_DOWNLOAD_UUIDS_KEY = "orderItems";
export const DOWNLOAD_ITEMS_CHANGED_EVENT = "downloadItemsChanged";

type StoredDownloadItem = {
  accessIsOpendata: boolean;
  accessIsRestricted: boolean;
  distributionUrl: string;
  name: string;
  organizationName: string | null;
  uuid: string;
};

function normalizeDownloadItems(items: DownloadItem[]): StoredDownloadItem[] {
  const uniqueItems = new Map<string, StoredDownloadItem>();

  for (const item of items) {
    if (!item.uuid || !item.distributionUrl) continue;

    uniqueItems.set(item.uuid, {
      accessIsOpendata: item.accessType?.toLocaleLowerCase() === "open",
      accessIsRestricted: item.accessType?.toLocaleLowerCase() === "restricted",
      uuid: item.uuid,
      name: item.name,
      organizationName: item.organizationName,
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

export function readSelectedDownloadUuids(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(SELECTED_DOWNLOAD_UUIDS_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isItemSelectedForDownload(uuid: string): boolean {
  return readSelectedDownloadUuids().includes(uuid);
}

export function addItemsToDownloads(items: DownloadItem[]) {
  const normalizedItems = normalizeDownloadItems(items);

  if (normalizedItems.length === 0) return;

  const selectedItems = new Set(readSelectedDownloadUuids());

  for (const item of normalizedItems) {
    // Elementer vi ikke fikk lagret metadata for skal heller ikke inn i
    // indeksen, ellers ender vi opp med et utvalg som peker på ingenting.
    if (!safeSetItem(`${item.uuid}.metadata`, JSON.stringify(item))) continue;
    selectedItems.add(item.uuid);
  }

  safeSetItem(SELECTED_DOWNLOAD_UUIDS_KEY, JSON.stringify([...selectedItems]));
  // Sendes uansett, slik at knappene leser tilbake det som faktisk ble lagret.
  dispatchDownloadItemsChanged();
}

export function removeItemsFromDownloads(items: DownloadItem[]) {
  const normalizedItems = normalizeDownloadItems(items);

  if (normalizedItems.length === 0) return;

  const idsToRemove = new Set(normalizedItems.map((item) => item.uuid));
  const remainingItems = readSelectedDownloadUuids().filter(
    (id) => !idsToRemove.has(id),
  );

  for (const item of normalizedItems) {
    safeRemoveItem(`${item.uuid}.metadata`);
  }

  safeSetItem(SELECTED_DOWNLOAD_UUIDS_KEY, JSON.stringify(remainingItems));
  dispatchDownloadItemsChanged();
}

export function clearDownloads() {
  const currentItems = readSelectedDownloadUuids();

  for (const uuid of currentItems) {
    safeRemoveItem(`${uuid}.metadata`);
  }

  safeRemoveItem(SELECTED_DOWNLOAD_UUIDS_KEY);
  dispatchDownloadItemsChanged();
}
