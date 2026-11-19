"use client";

import type { ReactNode } from "react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ProductActions.module.css";

export function TrackedActionLinkButton({
  href,
  icon,
  title,
  target = "_blank",
  eventName,
  properties,
  variant = "secondary",
}: {
  href: string;
  icon: ReactNode;
  title: string;
  target?: string | "_blank";
  eventName: string;
  properties?: Record<string, unknown>;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      data-variant={variant}
      target={target}
      rel="noreferrer"
      href={href}
      className={`ds-button ${styles.actionButton}`}
      onClick={() =>
        trackClick(eventName, LOCATIONS.MetadataPage, { title, ...properties })
      }
    >
      {icon}
      {title}
    </a>
  );
}
