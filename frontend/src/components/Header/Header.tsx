"use client";

import { Avatar, Badge, Button } from "@kv-designsystem/react";
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
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { basePath, isBeta } from "@/lib/basePath";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./Header.module.css";
import { HeaderMenu } from "./HeaderMenu";
import { HeaderProfile } from "./HeaderProfile";
import { ProfileDropdown } from "./ProfileDropdown";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [openPanel, setOpenPanel] = useState<"menu" | "profile" | null>(null);

  const trackHeaderClick = (clickItem: string) =>
    trackClick(clickItem, LOCATIONS.Header);
  const togglePanel = (panel: "menu" | "profile") => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
    trackHeaderClick(panel);
  };

  // Midlertidig til vi har innlogging koblet på
  const user = { name: "Frodo Baggins" };
  // const user = null; // test utlogget tilstand

  // Midlertidig til nedlasting/kart-state kobles på (produktsiden)
  const mapCount = 0;
  const downloadCount = 0;

  const geonorgeHref = isBeta ? "https://www.geonorge.no/" : "/";
  const findDataHref = isBeta ? "https://kartkatalog.geonorge.no/" : "/";
  const mapHref =
    "https://kartkatalog.geonorge.no/kart?lat=7197860&lon=396722&zoom=4";
  const downloadHref = "https://kartkatalog.geonorge.no/nedlasting";

  const rootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

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
        if (openPanel === "menu") menuButtonRef.current?.focus();
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
          <Link
            href={geonorgeHref}
            onClick={() => trackHeaderClick("geonorge-logo")}
          >
            <Image
              src={`${basePath}/geonorge-logo.svg`}
              alt="Geonorge"
              width={211}
              height={33}
              preload
            />
          </Link>
          <div className={styles.actions}>
            <Button
              asChild
              variant="tertiary"
              data-color="neutral"
              className={`${styles.showFromSm} ${isHome ? styles.navActive : ""}`}
            >
              <Link
                href={findDataHref}
                aria-current={isHome ? "page" : undefined}
                onClick={() => trackHeaderClick("finn-data")}
              >
                <MagnifyingGlassIcon aria-hidden />
                Finn data
              </Link>
            </Button>
            <Button
              asChild
              variant="tertiary"
              data-color="neutral"
              className={styles.showFromXl}
            >
              <Link href={mapHref} onClick={() => trackHeaderClick("kart")}>
                <Badge.Position
                  overlap="circle"
                  placement="top-left"
                  className={styles.badge}
                >
                  {mapCount > 0 && (
                    <Badge count={mapCount} data-color="neutral" />
                  )}
                  <LocationPinIcon aria-hidden />
                </Badge.Position>
                Kart
              </Link>
            </Button>
            <Button
              asChild
              variant="tertiary"
              data-color="neutral"
              className={styles.showFromXl}
            >
              <Link
                href={downloadHref}
                onClick={() => trackHeaderClick("nedlastingskurv")}
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
              </Link>
            </Button>
            {!isBeta &&
              (user ? (
                <>
                  <ProfileDropdown
                    userName={user.name}
                    className={styles.showFromLg}
                    posthogClick={() => trackHeaderClick("profil")}
                  />
                  <Button
                    ref={profileButtonRef}
                    variant="tertiary"
                    data-color="neutral"
                    className={styles.tabletOnly}
                    aria-expanded={openPanel === "profile"}
                    aria-controls="header-profile-panel"
                    onClick={() => togglePanel("profile")}
                  >
                    <Avatar aria-hidden data-size="xs" />
                    {user.name}
                  </Button>
                </>
              ) : (
                <Button
                  variant="tertiary"
                  data-color="neutral"
                  className={styles.showFromSm}
                  onClick={() => trackHeaderClick("login")}
                >
                  <EnterIcon aria-hidden />
                  Logg inn
                </Button>
              ))}
            <Button
              ref={menuButtonRef}
              variant="tertiary"
              data-color="neutral"
              aria-label="Meny"
              aria-expanded={openPanel === "menu"}
              aria-controls="header-menu-panel"
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
      {openPanel === "menu" && (
        <HeaderMenu
          closePanel={() => setOpenPanel(null)}
          userName={user?.name}
          mapCount={mapCount}
          downloadCount={downloadCount}
          findDataHref={findDataHref}
          mapHref={mapHref}
          downloadHref={downloadHref}
          posthogClickAction={trackHeaderClick}
        />
      )}
      {openPanel === "profile" && <HeaderProfile />}
    </div>
  );
}
