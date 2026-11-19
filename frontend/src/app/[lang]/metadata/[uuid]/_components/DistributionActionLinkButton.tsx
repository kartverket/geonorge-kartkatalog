"use client";

import { Button } from "@kv-designsystem/react";
import type { MouseEvent, ReactNode } from "react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

export function DistributionActionLinkButton({
  href,
  icon,
  title,
  eventName,
  trackingProperties,
  size,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  eventName: string;
  trackingProperties?: Record<string, unknown>;
  size?: "sm" | "md" | "lg";
}) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    trackClick(eventName, LOCATIONS.MetadataPageTabs, trackingProperties);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <Button variant="secondary" onClick={handleClick} data-size={size}>
      {icon}
      {title}
    </Button>
  );
}
