"use client";

import { type RefObject, useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 800px)";
const SCROLL_THRESHOLD = 8;

/** Returns true while the user scrolls down on mobile; false on scroll up, at the top, or on larger screens. */
export function useHideOnScrollDown(
  disabled: boolean,
  scopeRef: RefObject<HTMLElement | null>,
) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      if (!mql.matches || y <= SCROLL_THRESHOLD) {
        setHidden(false);
      } else if (y - lastY > SCROLL_THRESHOLD) {
        // Keep visible while a field inside the scope has focus (e.g. typing with the keyboard open)
        const active = document.activeElement;
        if (
          active &&
          scopeRef.current?.contains(active) &&
          active.matches("input, textarea, select")
        ) {
          lastY = y;
          return;
        }
        setHidden(true);
      } else if (lastY - y > SCROLL_THRESHOLD) {
        setHidden(false);
      } else {
        return;
      }
      lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onChange = () => {
      lastY = window.scrollY;
      if (!mql.matches) setHidden(false);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    mql.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mql.removeEventListener("change", onChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scopeRef]);

  return hidden && !disabled;
}
