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
}: {
  href: string;
  icon: ReactNode;
  title: string;
  eventName: string;
  trackingProperties?: Record<string, unknown>;
}) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    trackClick(eventName, LOCATIONS.MetadataPageTabs, trackingProperties);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <Button variant="secondary" onClick={handleClick}>
      {icon}
      {title}
    </Button>
  );
}
