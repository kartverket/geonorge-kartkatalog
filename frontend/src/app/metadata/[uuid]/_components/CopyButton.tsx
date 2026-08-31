"use client";
import { Button } from "@kv-designsystem/react";
import { FilesIcon } from "@navikt/aksel-icons";
import { useCopyUrl } from "@/app/metadata/[uuid]/_utils/hooks";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

export function CopyButton({
  url,
  className,
  eventName = "copy-link",
  trackingProperties,
}: {
  url: string;
  className?: string;
  eventName?: string;
  trackingProperties?: Record<string, unknown>;
}) {
  const { copied, copy } = useCopyUrl(url);
  return (
    <Button
      variant="secondary"
      className={className}
      onClick={() => {
        trackClick(eventName, LOCATIONS.MetadataPageTabs, trackingProperties);
        copy();
      }}
    >
      {copied ? (
        "Kopiert"
      ) : (
        <>
          <FilesIcon aria-hidden /> Kopier lenke
        </>
      )}
    </Button>
  );
}
