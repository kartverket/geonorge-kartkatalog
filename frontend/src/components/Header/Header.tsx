"use client";

import { Button } from "@kv-designsystem/react";
import {
  DownloadIcon,
  LocationPinIcon,
  MagnifyingGlassIcon,
  MenuHamburgerIcon,
  PersonCircleIcon,
  XMarkIcon,
} from "@navikt/aksel-icons";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./Header.module.css";
import { HeaderMenu } from "./HeaderMenu";
import { HeaderSearch } from "./HeaderSearch";

export function Header() {
  const [openPanel, setOpenPanel] = useState<"search" | "menu" | null>(null);
  const togglePanel = (panel: "search" | "menu") => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };
  return (
    <div className={styles.root}>
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
              className={styles.hideOnMobile}
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
              className={styles.hideOnTablet}
            >
              <LocationPinIcon aria-hidden />
              Kart
            </Button>
            <Button
              variant="tertiary"
              data-color="neutral"
              className={styles.hideOnTablet}
            >
              <DownloadIcon aria-hidden />
              Nedlastingskurv
            </Button>
            <Button
              variant="tertiary"
              data-color="neutral"
              className={styles.hideOnTablet}
            >
              <PersonCircleIcon aria-hidden />
              Logg inn
            </Button>
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
              <span className={styles.hideOnMobile}>Meny</span>
            </Button>
          </div>
        </div>
      </header>
      {openPanel === "search" && <HeaderSearch />}
      {openPanel === "menu" && (
        <HeaderMenu onNavigate={() => setOpenPanel(null)} />
      )}
    </div>
  );
}
