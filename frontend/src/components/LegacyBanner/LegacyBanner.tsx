"use client";
import { Heading, Paragraph } from "@kv-designsystem/react";
import { HangerIcon } from "@navikt/aksel-icons";
import { useParams } from "next/navigation";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./LegacyBanner.module.css";

export function LegacyBanner() {
  const params = useParams<{ uuid?: string | string[] }>();
  const uuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  const legacyHref = uuid
    ? `https://kartkatalog.geonorge.no/metadata/${uuid}`
    : "https://kartkatalog.geonorge.no/";
  const handleLegacyLinkClick = () => {
    trackClick("go-to-legacy", LOCATIONS.LegacyBanner, {
      href: legacyHref,
      ...(uuid ? { itemUuid: uuid } : {}),
    });
  };

  return (
    <aside className={styles.banner} aria-label="Informasjon om gammel drakt">
      <div className={styles.inner}>
        <div className={styles.content}>
          <HangerIcon color="#2A6382" />
          <div className={styles.textContent}>
            <Heading data-size="xs" className={styles.heading}>
              Vil du gå tilbake til gammel drakt?
            </Heading>
            <Paragraph data-size="xs" className={styles.paragraph}>
              Gi oss gjerne tilbakemeldinger i skjemaet under.{" "}
              <a href={legacyHref} onClick={handleLegacyLinkClick}>
                Gå tilbake
              </a>
            </Paragraph>
          </div>
        </div>
      </div>
    </aside>
  );
}
