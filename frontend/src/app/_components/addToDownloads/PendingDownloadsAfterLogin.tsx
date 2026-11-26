"use client";

import { useEffect } from "react";
import { addItemsToDownloads } from "@/app/_components/addToDownloads/downloadStorage";
import { takePendingDownloads } from "@/app/_components/addToDownloads/pendingDownloads";
import { useAuthInfo } from "@/components/AuthProvider";

/**
 * Fullfører «Logg inn og legg til»: etter innlogging legges datasettene i kurven,
 * og brukeren sendes tilbake til siden de var på (innloggingen sender til forsiden).
 */
export function PendingDownloadsAfterLogin() {
  const authStatus = useAuthInfo().status;

  useEffect(() => {
    if (authStatus === "loading") return;

    const pending = takePendingDownloads();
    // Avbrutt innlogging: glem det som ventet, og ikke send brukeren noe sted
    if (!pending || authStatus !== "authenticated") return;

    addItemsToDownloads(pending.items);

    const currentUrl = window.location.pathname + window.location.search;
    if (pending.returnUrl !== currentUrl) {
      window.location.replace(pending.returnUrl);
    }
  }, [authStatus]);

  return null;
}
