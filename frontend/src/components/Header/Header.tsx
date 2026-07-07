"use client";

import styles from "./Header.module.css";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@kv-designsystem/react";
import {
  MagnifyingGlassIcon,
  LocationPinIcon,
  DownloadIcon,
  PersonCircleIcon,
  MenuHamburgerIcon,
} from "@navikt/aksel-icons";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/">
          <Image
            src="/geonorge_logo1.svg"
            alt="Geonorge"
            width={211}
            height={33}
            priority
          />
        </Link>
        <nav aria-label="Hovedmeny" className={styles.nav}>
          <Button variant="tertiary" data-color="neutral"
          className={styles.hideOnMobile}>
            <MagnifyingGlassIcon aria-hidden />
            Søk
          </Button>
          <Button variant="tertiary" data-color="neutral"
          className={styles.hideOnTablet}>
            <LocationPinIcon aria-hidden />
            Kart
          </Button>
          <Button variant="tertiary" data-color="neutral"
          className={styles.hideOnTablet}>
            <DownloadIcon aria-hidden />
            Nedlastingskurv
          </Button>
          <Button variant="tertiary" data-color="neutral"
          className={styles.hideOnTablet}>
            <PersonCircleIcon aria-hidden />
            Logg inn
          </Button>
          <Button variant="tertiary" data-color="neutral">
            <MenuHamburgerIcon aria-hidden />
            <span className={styles.hideOnMobile}>Meny</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
