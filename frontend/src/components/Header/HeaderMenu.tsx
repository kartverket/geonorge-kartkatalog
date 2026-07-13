"use client";

import { Button, Details, Divider, Heading } from "@kv-designsystem/react";
import {
  DownloadIcon,
  LanguageIcon,
  LocationPinIcon,
  MagnifyingGlassIcon,
  EnterIcon,
} from "@navikt/aksel-icons";
import Link from "next/link";
import styles from "./HeaderMenu.module.css";

const MENU_SECTIONS = [
  {
    title: "Kartdata",
    links: [
      { label: "Kartkatalogen", href: "/" },
      { label: "Tilgang og passord", href: "#" },
      { label: "Datasett i Geonorge", href: "#" },
    ],
  },
  {
    title: "Aktuelt",
    links: [
      { label: "Nyheter", href: "#" },
      { label: "Varsler og driftsmeldinger", href: "#" },
      { label: "Om Geonorge", href: "#" },
    ],
  },
  {
    title: "Geodataarbeid",
    links: [
      { label: "Standardisering", href: "#" },
      { label: "Veiledere", href: "#" },
      { label: "Geografisk infrastruktur", href: "#" },
      { label: "Det offentlige kartgrunnlaget", href: "#" },
      { label: "Forvaltningsinformasjon", href: "#" },
      { label: "Inspire", href: "#" },
    ],
  },
  {
    title: "Verktøy",
    links: [
      { label: "Registrene", href: "#" },
      { label: "Verktøy og veiledere for produktspesifikasjoner", href: "#" },
      { label: "API-er og grensesnitt", href: "#" },
      { label: "Andre ressurser", href: "#" },
      { label: "Min side", href: "#" },
    ],
  },
];

export function HeaderMenu({
  onNavigate,
  onOpenSearch,
}: {
  onNavigate: () => void;
  onOpenSearch: () => void;
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelInner}>
        <div className={styles.menuActions}>
          <Button
            variant="tertiary"
            data-color="neutral"
            className={styles.inMenuFromSm}
            onClick={onOpenSearch}
          >
            <MagnifyingGlassIcon aria-hidden />
            Søk
          </Button>
          <Button
            variant="tertiary"
            data-color="neutral"
            className={styles.inMenuFromXl}
          >
            <LocationPinIcon aria-hidden />
            Kart
          </Button>
          <Button
            variant="tertiary"
            data-color="neutral"
            className={styles.inMenuFromXl}
          >
            <DownloadIcon aria-hidden />
            Nedlastingskurv
          </Button>
          <Button variant="tertiary" data-color="neutral">
            <LanguageIcon aria-hidden />
            <span>EN</span>
          </Button>
          <Button
            variant="tertiary"
            data-color="neutral"
            className={styles.InMenuFromLg}
          >
            <EnterIcon aria-hidden />
            Logg inn
          </Button>
        </div>
        <Divider className={styles.divider} />
        <nav aria-label="Hovedmeny" data-color="info">
          <ul className={styles.section}>
            {MENU_SECTIONS.map((section) => (
              <li key={section.title}>
                <Heading data-size="sm">{section.title}</Heading>
                <ul className={styles.linkList}>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.href === "/" ? (
                        <Link href="/" onClick={onNavigate}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} onClick={onNavigate}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className={styles.accordions}>
            {MENU_SECTIONS.map((section) => (
              <Details key={section.title} data-color="info">
                <Details.Summary>{section.title}</Details.Summary>
                <Details.Content>
                  <ul className={styles.linkList}>
                    {section.links.map((link) => (
                      <li key={link.label}>
                        {link.href === "/" ? (
                          <Link href="/" onClick={onNavigate}>
                            {link.label}
                          </Link>
                        ) : (
                          <a href={link.href} onClick={onNavigate}>
                            {link.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </Details.Content>
              </Details>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
