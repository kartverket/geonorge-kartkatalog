export type MapItem = {
  DistributionProtocol: string;
  GetCapabilitiesUrl: string | null;
  Title: string;
  Uuid: string;
  addLayers: string[];
};

export const MAP_ITEMS_KEY = "mapItems";
export const MAP_ITEMS_CHANGED_EVENT = "mapItemsChanged";

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Kunne ikke lagre "${key}" i localStorage`, error);
    return false;
  }
}

function dispatchMapItemsChanged() {
  if (typeof document === "undefined") return;
  document.dispatchEvent(new Event(MAP_ITEMS_CHANGED_EVENT));
}

export function readMapItems(): MapItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(MAP_ITEMS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isItemInMap(uuid: string): boolean {
  return readMapItems().some((item) => item.Uuid === uuid);
}

export function addItemToMap(item: MapItem) {
  if (!item.Uuid) return;

  const selectedItems = new Map(
    readMapItems().map((item) => [item.Uuid, item] as const),
  );

  selectedItems.set(item.Uuid, item);

  safeSetItem(MAP_ITEMS_KEY, JSON.stringify([...selectedItems.values()]));
  dispatchMapItemsChanged();
}

export function removeItemFromMap(item: MapItem) {
  if (!item.Uuid) return;

  const remainingItems = readMapItems().filter(
    (mapItem) => mapItem.Uuid !== item.Uuid,
  );

  safeSetItem(MAP_ITEMS_KEY, JSON.stringify(remainingItems));
  dispatchMapItemsChanged();
}
