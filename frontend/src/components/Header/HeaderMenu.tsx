"use client";

import {
  Avatar,
  Badge,
  Button,
  Details,
  Divider,
  Heading,
} from "@kv-designsystem/react";
import {
  DownloadIcon,
  EnterIcon,
  LanguageIcon,
  LocationPinIcon,
  MagnifyingGlassIcon,
} from "@navikt/aksel-icons";
import type { Route } from "next";
import Link from "next/link";
import { type MouseEvent, useState } from "react";
import { isBeta } from "@/lib/basePath";
import { LOCATIONS, trackClick, trackEvent } from "@/posthog/posthog";
import styles from "./HeaderMenu.module.css";
import { ProfileContent } from "./ProfileContent";

type MenuLink = { label: string; href: Route };
type MenuSection = { title: string; links: MenuLink[] };

const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Kartdata",
    links: [
      { label: "Kartkatalogen", href: "https://kartkatalog.geonorge.no/" },
      {
        label: "Tilgang og passord",
        href: "https://www.geonorge.no/kartdata/tilgang-og-passord/",
      },
      {
        label: "Datasett i Geonorge",
        href: "https://www.geonorge.no/kartdata/datasett-i-geonorge/",
      },
    ],
  },
  {
    title: "Aktuelt",
    links: [
      {
        label: "Nyheter",
        href: "https://www.geonorge.no/aktuelt/Se-siste-nyheter/",
      },
      {
        label: "Varsler og driftsmeldinger",
        href: "https://register.geonorge.no/register/varsler",
      },
      {
        label: "Om Geonorge",
        href: "https://www.geonorge.no/aktuelt/om-geonorge/",
      },
    ],
  },
  {
    title: "Geodataarbeid",
    links: [
      {
        label: "Standardisering",
        href: "https://www.geonorge.no/Geodataarbeid/standardisering/",
      },
      {
        label: "Veiledere",
        href: "https://www.geonorge.no/Geodataarbeid/veiledere/",
      },
      {
        label: "Geografisk infrastruktur",
        href: "https://www.geonorge.no/Geodataarbeid/geografisk-infrastruktur/",
      },
      {
        label: "Det offentlige kartgrunnlaget",
        href: "https://www.geonorge.no/Geodataarbeid/det-offentlige-kartgrunnlaget/",
      },
      {
        label: "Forvaltningsinformasjon",
        href: "https://forvaltningsinformasjon.geonorge.no/",
      },
      {
        label: "Inspire",
        href: "https://www.geonorge.no/Geodataarbeid/inspire/",
      },
    ],
  },
  {
    title: "Verktøy",
    links: [
      { label: "Registrene", href: "https://register.geonorge.no/" },
      {
        label: "Verktøy og veiledere for produktspesifikasjoner",
        href: "https://www.geonorge.no/verktoy/verktoy-for-produktspesifikasjon/",
      },
      {
        label: "API-er og grensesnitt",
        href: "https://www.geonorge.no/verktoy/APIer-og-grensesnitt/",
      },
      {
        label: "Andre ressurser",
        href: "https://www.geonorge.no/verktoy/andre-ressurser/",
      },
      { label: "Min side", href: "https://minside.geonorge.no/" },
    ],
  },
];

function MenuLinkList({
  links,
  closePanel,
}: {
  links: MenuLink[];
  closePanel: () => void;
}) {
  const onNavigate = (eventClicked: string) => {
    trackEvent(`${eventClicked}-clicked`, { location: LOCATIONS.HeaderMenu });
    closePanel();
  };

  return (
    <ul className={styles.linkList}>
      {links.map((link) => (
        <li key={link.label}>
          <Link href={link.href} onClick={() => onNavigate(link.label)}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function trackAccordionClick(
  event: MouseEvent<HTMLElement>,
  sectionTitle: string,
) {
  const detailsElement = event.currentTarget.closest("details");

  trackClick("toggle-accordion", LOCATIONS.HeaderMenu, {
    accordionTitle: sectionTitle,
    isExpanded: !detailsElement?.open,
  });
}

export function HeaderMenu({
  closePanel,
  userName,
  mapCount,
  downloadCount,
  posthogClick,
}: {
  closePanel: () => void;
  userName?: string;
  mapCount: number;
  downloadCount: number;
  posthogClick: (clickItem: string) => void;
}) {
  const [view, setView] = useState<"nav" | "profile">("nav");
  return (
    <div className={styles.panel}>
      <div className={styles.panelInner}>
        <div className={styles.menuActions}>
          <Button
            asChild
            variant="tertiary"
            data-color="neutral"
            className={styles.inMenuFromSm}
          >
            <Link
              href="/"
              onClick={() => {
                posthogClick("search");
                closePanel();
              }}
            >
              <MagnifyingGlassIcon aria-hidden />
              Finn data
            </Link>
          </Button>
          <Button
            variant="tertiary"
            data-color="neutral"
            className={styles.inMenuFromXl}
            onClick={() => posthogClick("map")}
          >
            <Badge.Position
              overlap="circle"
              placement="top-left"
              className={styles.badge}
            >
              {mapCount > 0 && <Badge count={mapCount} data-color="neutral" />}
              <LocationPinIcon aria-hidden />
            </Badge.Position>
            Kart
          </Button>
          <Button
            variant="tertiary"
            data-color="neutral"
            className={styles.inMenuFromXl}
            onClick={() => posthogClick("cart")}
          >
            <Badge.Position
              overlap="circle"
              placement="top-left"
              className={styles.badge}
            >
              {downloadCount > 0 && (
                <Badge count={downloadCount} data-color="danger" />
              )}
              <DownloadIcon aria-hidden />
            </Badge.Position>
            Nedlastingskurv
          </Button>
          {isBeta && (
            <Button
              variant="tertiary"
              data-color="neutral"
              onClick={() => posthogClick("change-language")}
            >
              <LanguageIcon aria-hidden />
              <span>EN</span>
            </Button>
          )}
          {isBeta &&
            (userName ? (
              <Button
                variant="tertiary"
                data-color="neutral"
                className={styles.inMenuFromSm}
                aria-expanded={view === "profile"}
                onClick={() => {
                  setView(view === "profile" ? "nav" : "profile");
                  posthogClick("profile");
                }}
              >
                <Avatar aria-hidden data-size="xs" />
                {userName}
              </Button>
            ) : (
              <Button
                variant="tertiary"
                data-color="neutral"
                className={styles.inMenuFromSm}
                onClick={() => posthogClick("login")}
              >
                <EnterIcon aria-hidden />
                Logg inn
              </Button>
            ))}
        </div>
        <Divider className={isBeta ? styles.divider : styles.dividerHidden} />
        {view === "profile" ? (
          <ProfileContent location={LOCATIONS.HeaderMenu} />
        ) : (
          <nav aria-label="Hovedmeny" data-color="info">
            <ul className={styles.section}>
              {MENU_SECTIONS.map((section) => (
                <li key={section.title}>
                  <Heading data-size="sm">{section.title}</Heading>
                  <MenuLinkList links={section.links} closePanel={closePanel} />
                </li>
              ))}
            </ul>
            <div className={styles.accordions}>
              {MENU_SECTIONS.map((section) => (
                <Details key={section.title}>
                  <Details.Summary
                    onClick={(event) =>
                      trackAccordionClick(event, section.title)
                    }
                  >
                    {section.title}
                  </Details.Summary>
                  <Details.Content>
                    <MenuLinkList
                      links={section.links}
                      closePanel={closePanel}
                    />
                  </Details.Content>
                </Details>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
