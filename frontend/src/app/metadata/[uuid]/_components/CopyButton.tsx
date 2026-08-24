"use client";
import { Button } from "@kv-designsystem/react";
import { FilesIcon } from "@navikt/aksel-icons";
import { useCopyUrl } from "@/app/metadata/[uuid]/_utils/hooks";

export function CopyButton({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const { copied, copy } = useCopyUrl(url);
  return (
    <Button variant="secondary" className={className} onClick={copy}>
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
