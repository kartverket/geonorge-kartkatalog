"use client";
import { Button } from "@kv-designsystem/react";
import { FilesIcon } from "@navikt/aksel-icons";
import { useCopyUrl } from "@/app/metadata/[uuid]/_utils/hooks";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

export function CopyButton({
  url,
  className,
  eventName = "copy-link",
}: {
  url: string;
  className?: string;
  eventName?: string;
}) {
  const { copied, copy } = useCopyUrl(url);
  return (
    <Button
      variant="secondary"
      className={className}
      onClick={() => {
        trackClick(eventName, LOCATIONS.MetadataPageTabs);
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
