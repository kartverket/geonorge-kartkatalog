"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import {
  addItemsToDownloads,
  type DownloadItem,
  removeItemsFromDownloads,
} from "@/app/_components/addToDownloads/downloadStorage";
import { useAreAllItemsSelectedForDownload } from "@/app/_components/addToDownloads/useDownloads";
import { type Location, trackClick } from "@/posthog/posthog";

//Note, can only add open data here. In future, handle closed datasets when login is ok.
export default function AddSeriesToDownloadsButton({
  item,
  downloadableItems,
  className,
  variant,
  size,
  location,
}: {
  item: { uuid: string; title: string };
  downloadableItems: DownloadItem[];
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
  location: Location;
}) {
  const addableItems = downloadableItems.filter((i) => i.accessType === "open");
  const areItemsSelectedForDownload =
    useAreAllItemsSelectedForDownload(addableItems);

  const hasDownloadableItems = addableItems.some(
    (item) => item.uuid && item.distributionUrl,
  );

  if (!hasDownloadableItems) return null;

  const handleToggleDownloads = () => {
    trackClick(
      areItemsSelectedForDownload
        ? "remove-all-from-downloads"
        : "add-all-to-downloads",
      location,
      {
        itemName: item.title,
        itemUuid: item.uuid,
        numberOfItems: addableItems.length,
      },
    );

    if (areItemsSelectedForDownload) {
      removeItemsFromDownloads(addableItems);
      return;
    }

    addItemsToDownloads(addableItems);
  };

  return (
    <Button
      variant={
        variant ?? (areItemsSelectedForDownload ? "secondary" : "primary")
      }
      data-size={size}
      className={className}
      onClick={handleToggleDownloads}
    >
      {areItemsSelectedForDownload ? (
        <>
          <TrashIcon aria-hidden />
          Fjern alle fra nedlasting
        </>
      ) : (
        <>
          <DownloadIcon aria-hidden />
          Legg alle til nedlasting
        </>
      )}
    </Button>
  );
}
