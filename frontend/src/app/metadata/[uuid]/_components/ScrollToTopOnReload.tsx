"use client";

import { useEffect } from "react";

// Nettleseren gjenoppretter scrollposisjon ved refresh. På produktsiden vil vi
// heller starte på toppen, så vi skrur av dette mens siden er åpen.
export function ScrollToTopOnReload() {
  useEffect(() => {
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = "auto";
    };
  }, []);

  return null;
}
