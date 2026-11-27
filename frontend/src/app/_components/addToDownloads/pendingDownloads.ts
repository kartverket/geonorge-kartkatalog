import type { DownloadItem } from "@/app/_components/addToDownloads/downloadStorage";

// Datasett som skal legges til etter innlogging, og siden brukeren skal tilbake til.
// sessionStorage, så det bare gjelder fanen der brukeren trykket «Logg inn og legg til».
const PENDING_DOWNLOADS_KEY = "pendingDownloadsAfterLogin";

type PendingDownloads = {
  items: DownloadItem[];
  returnUrl: string;
};

export function savePendingDownloads(items: DownloadItem[]) {
  const pending: PendingDownloads = {
    items,
    returnUrl: window.location.pathname + window.location.search,
  };
  try {
    sessionStorage.setItem(PENDING_DOWNLOADS_KEY, JSON.stringify(pending));
  } catch (error) {
    console.error("Kunne ikke huske datasett til etter innlogging", error);
  }
}

/** Henter og fjerner det som venter, så det bare brukes én gang. */
export function takePendingDownloads(): PendingDownloads | null {
  try {
    const stored = sessionStorage.getItem(PENDING_DOWNLOADS_KEY);
    if (!stored) return null;
    sessionStorage.removeItem(PENDING_DOWNLOADS_KEY);
    return JSON.parse(stored) as PendingDownloads;
  } catch {
    return null;
  }
}
