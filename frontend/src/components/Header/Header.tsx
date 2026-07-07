import styles from "./Header.module.css";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@digdir/designsystemet-react";
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
          <Button variant="tertiary">
            <MagnifyingGlassIcon aria-hidden />
            Søk
          </Button>
          <Button variant="tertiary">
            <LocationPinIcon aria-hidden />
            Kart
          </Button>
          <Button variant="tertiary">
            <DownloadIcon aria-hidden />
            Nedlastingskurv
          </Button>
          <Button variant="tertiary">
            <PersonCircleIcon aria-hidden />
            Logg inn
          </Button>
          <Button variant="tertiary">
            <MenuHamburgerIcon aria-hidden />
            Meny
          </Button>
        </nav>
      </div>
    </header>
  );
}
