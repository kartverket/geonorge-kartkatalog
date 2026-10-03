"use client";

import { Button, Dropdown } from "@kv-designsystem/react";
import { EnterIcon } from "@navikt/aksel-icons";
import type { Route } from "next";
import Image from "next/image";
import { basePath } from "@/lib/basePath";
import styles from "./LoginDropdown.module.css";

export function LoginDropdown({
  id,
  className,
  geoIdHref,
  ansattportenHref,
  onOpen,
  onNavigate,
}: {
  id: string;
  className?: string;
  geoIdHref: Route;
  ansattportenHref: Route;
  onOpen: () => void;
  onNavigate: (provider: "geoid" | "ansattporten") => void;
}) {
  return (
    <>
      <Button
        variant="tertiary"
        className={className}
        popovertarget={id}
        onClick={onOpen}
      >
        <EnterIcon aria-hidden />
        Logg inn
      </Button>
      <Dropdown id={id}>
        <Dropdown.List>
          <Dropdown.Item>
            <Dropdown.Button asChild>
              <a href={geoIdHref} onClick={() => onNavigate("geoid")}>
                <Image
                  src={`${basePath}/geonorge-symbol.svg`}
                  alt=""
                  width={26}
                  height={33}
                  className={styles.providerIcon}
                />
                Logg inn med GeoID
              </a>
            </Dropdown.Button>
          </Dropdown.Item>
          <Dropdown.Item>
            <Dropdown.Button asChild>
              <a
                href={ansattportenHref}
                onClick={() => onNavigate("ansattporten")}
              >
                <Image
                  src={`${basePath}/digdir-symbol.svg`}
                  alt=""
                  width={33}
                  height={33}
                  className={styles.providerIcon}
                />
                Logg inn med Ansattporten
              </a>
            </Dropdown.Button>
          </Dropdown.Item>
        </Dropdown.List>
      </Dropdown>
    </>
  );
}
