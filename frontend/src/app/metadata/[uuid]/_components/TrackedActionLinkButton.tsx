"use client";

import type { ReactNode } from "react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ProductActions.module.css";

export function TrackedActionLinkButton({
  href,
  icon,
  title,
  eventName,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  eventName: string;
}) {
  return (
    <a
      data-variant="secondary"
      data-color="neutral"
      target="_blank"
      rel="noreferrer"
      href={href}
      className={`ds-button ${styles.actionButton}`}
      onClick={() => trackClick(eventName, LOCATIONS.MetadataPage, { title })}
    >
      {icon}
      {title}
    </a>
  );
}
