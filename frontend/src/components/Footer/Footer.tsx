// forslag til avgjørelse:
// dropper kv-komponenter
// for at footer skal være server component
// fordi footeren er statisk
// kan endres senere ved å legge til use client

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const OM_NETTSTEDET: { label: string; href: Route }[] = [
  {
    label: "Om Geonorge",
    href: "https://www.geonorge.no/aktuelt/om-geonorge/",
  },
  {
    label: "Tilgjengelighetserklæring",
    href: "https://uustatus.no/nb/erklaringer/publisert/8f3210cf-aa22-4d32-9fda-4460e3c3e05a\n",
  },
  {
    label: "Personver og bruk av cookies",
    href: "https://www.geonorge.no/aktuelt/Se-siste-nyheter/nyheter2/annet/personvern-og-bruk-av-cookies/",
  },
];

const KONTAKT = [
  { prefix: "Telefon: ", label: "32 11 80 00", href: "tel:+4732118000" },
  {
    prefix: "E-post: ",
    label: "post@norgedigitalt.no",
    href: "mailto:post@norgedigitalt.no",
  },
  { label: "Kontaktinfo og adresser", href: "#" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image
            src="/geonorge-logo-hvit.svg"
            alt="Geonorge logo hvit"
            width={262}
            height={41}
          />
          <p className={styles.tagline}>
            En tjeneste fra
            <Image
              src="/KV-logo.svg"
              alt="Kartverket"
              width={125}
              height={34}
            />
          </p>
        </div>
        <nav aria-label="Footermeny" className={styles.columns}>
          <section>
            <h2 className={styles.heading}>Om nettstedet</h2>
            <ul className={styles.linkList}>
              {OM_NETTSTEDET.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className={styles.heading}>Kontakt</h2>
            <ul className={styles.linkList}>
              {KONTAKT.map((item) => (
                <li key={item.label}>
                  {item.prefix}
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </section>
        </nav>
      </div>
    </footer>
  );
}
