// forslag til avgjørelse:
// dropper kv-komponenter og Link fra next
// for at footer skal være server component
// fordi footeren er statisk
// kan endres senere ved å legge til use client

import Image from "next/image";
import styles from "./Footer.module.css";

const OM_NETTSTEDET = [
  { label: "Om Geonorge", href: "#" },
  { label: "Personvernerklæring", href: "#" },
  { label: "Erklæring om informasjonskapsler", href: "#" },
  { label: "Tilgjengelighetserklæring (uustatus.no)", href: "#" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <Image
            src="/geonorge-logo-hvit.svg"
            alt="Geonorge logo hvit"
            width={262}
            height={41}
          />
        </div>
        <nav className={styles.nav}>
          <ul>
            {OM_NETTSTEDET.map((item) => (
              <li key={item.label}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
