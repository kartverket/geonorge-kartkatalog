"use client";

import { Button, Divider, Heading } from "@kv-designsystem/react";
import { LanguageIcon } from "@navikt/aksel-icons";
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

export function HeaderMenu() {
  return (
    <div className={styles.panel}>
      <div className={styles.panelInner}>
        <Button
          variant="tertiary"
          data-color="neutral"
          className={styles.language}
        >
          <LanguageIcon aria-hidden />
          <span>EN</span>
        </Button>
        <Divider className={styles.divider} />
        <nav aria-label="Hovedmeny" data-color="info">
          <ul className={styles.section}>
            {MENU_SECTIONS.map((section) => (
              <li key={section.title}>
                <Heading data-size="sm">{section.title}</Heading>
                <ul className={styles.linkList}>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link href={link.href}>{link.label}</Link>
                      ) : (
                        <a href={link.href}>{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
