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
import { useAuthInfo } from "@/components/AuthProvider";
import { type Location, trackClick } from "@/posthog/posthog";

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
  const authState = useAuthInfo();
  const validItems = downloadableItems.filter(
    (item) => item.uuid && item.distributionUrl,
  );
  const addableItems = validItems.filter(
    (item) =>
      item.accessType?.toLocaleLowerCase() === "open" ||
      authState.status === "authenticated",
  );
  const areItemsSelectedForDownload =
    useAreAllItemsSelectedForDownload(addableItems);

  if (validItems.length === 0) return null;

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
      disabled={addableItems.length === 0}
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
