"use client";

import { Avatar, Button } from "@kv-designsystem/react";
import {
  DownloadIcon,
  EnterIcon,
  LocationPinIcon,
  MagnifyingGlassIcon,
  MenuHamburgerIcon,
  XMarkIcon,
} from "@navikt/aksel-icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./Header.module.css";
import { HeaderMenu } from "./HeaderMenu";
import { HeaderSearch } from "./HeaderSearch";

export function Header() {
  const [openPanel, setOpenPanel] = useState<"search" | "menu" | null>(null);
  const togglePanel = (panel: "search" | "menu") => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  // Midlertidig til vi har innlogging koblet på
  const user = { name: "Frodo Baggins" };
  // const user = null; // test utlogget tilstand

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openPanel) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenPanel(null);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openPanel]);

  return (
    <div className={styles.root} ref={rootRef}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/">
            <Image
              src="/geonorge_logo1.svg"
              alt="Geonorge"
              width={211}
              height={33}
              preload
            />
          </Link>
          <div className={styles.actions}>
            <Button
              variant="tertiary"
              data-color="neutral"
              className={styles.showFromSm}
              aria-expanded={openPanel === "search"}
              onClick={() => togglePanel("search")}
            >
              {openPanel === "search" ? (
                <XMarkIcon aria-hidden />
              ) : (
                <MagnifyingGlassIcon aria-hidden />
              )}
              Søk
            </Button>
            <Button
              variant="tertiary"
              data-color="neutral"
              className={styles.showFromXl}
            >
              <LocationPinIcon aria-hidden />
              Kart
            </Button>
            <Button
              variant="tertiary"
              data-color="neutral"
              className={styles.showFromXl}
            >
              <DownloadIcon aria-hidden />
              Nedlastingskurv
            </Button>
            {user ? (
              <Button
                variant="tertiary"
                data-color="neutral"
                className={styles.showFromLg}
              >
                <Avatar aria-hidden data-size="xs" />
                {user.name}
              </Button>
            ) : (
              <Button
                variant="tertiary"
                data-color="neutral"
                className={styles.showFromLg}
              >
                <EnterIcon aria-hidden />
                Logg inn
              </Button>
            )}
            <Button
              variant="tertiary"
              data-color="neutral"
              aria-label="Meny"
              aria-expanded={openPanel === "menu"}
              onClick={() => togglePanel("menu")}
            >
              {openPanel === "menu" ? (
                <XMarkIcon aria-hidden />
              ) : (
                <MenuHamburgerIcon aria-hidden />
              )}
              <span className={styles.showFromSm}>Meny</span>
            </Button>
          </div>
        </div>
      </header>
      {openPanel === "search" && <HeaderSearch />}
      {openPanel === "menu" && (
        <HeaderMenu
          onNavigate={() => setOpenPanel(null)}
          onOpenSearch={() => setOpenPanel("search")}
        />
      )}
    </div>
  );
}
