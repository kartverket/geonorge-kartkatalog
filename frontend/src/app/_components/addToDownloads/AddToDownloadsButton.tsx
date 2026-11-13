"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import type { MouseEvent } from "react";
import {
  addItemsToDownloads,
  type DownloadItem,
  removeItemsFromDownloads,
} from "@/app/_components/addToDownloads/downloadStorage";
import { useAreAllItemsSelectedForDownload } from "@/app/_components/addToDownloads/useDownloads";
import { useAuthInfo } from "@/components/AuthProvider";
import { type Location, trackClick } from "@/posthog/posthog";

export default function AddToDownloadsButton({
  items,
  item,
  className,
  variant,
  size,
  location,
  addLabel,
  removeLabel,
  preventAccordionToggle = false,
}: {
  items: DownloadItem[];
  item?: { uuid: string; name: string };
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
  location: Location;
  addLabel?: string;
  removeLabel?: string;
  preventAccordionToggle?: boolean;
}) {
  const authState = useAuthInfo();
  const validItems = items.filter((i) => i.uuid && i.distributionUrl);
  const addableItems = validItems.filter(
    (i) =>
      i.accessType?.toLocaleLowerCase() === "open" ||
      authState.status === "authenticated",
  );
  const isMultiple = validItems.length > 1;
  const resolvedAddLabel =
    addLabel ??
    (isMultiple ? "Legg alle til nedlasting" : "Legg til nedlasting");
  const resolvedRemoveLabel =
    removeLabel ??
    (isMultiple ? "Fjern alle fra nedlasting" : "Fjern fra nedlasting");

  const areAllValidItemsSelected =
    useAreAllItemsSelectedForDownload(validItems);
  const areAllAddableItemsSelected =
    useAreAllItemsSelectedForDownload(addableItems);
  const isRemoving = areAllValidItemsSelected || areAllAddableItemsSelected;

  if (validItems.length === 0) return null;

  const trackingItem = item ?? validItems[0];

  const handleToggleDownloads = (event: MouseEvent<HTMLButtonElement>) => {
    if (preventAccordionToggle) {
      event.preventDefault();
      event.stopPropagation();
    }

    trackClick(
      isRemoving
        ? isMultiple
          ? "remove-all-from-downloads"
          : "remove-from-downloads"
        : isMultiple
          ? "add-all-to-downloads"
          : "add-to-downloads",
      location,
      {
        itemName: trackingItem.name,
        itemUuid: trackingItem.uuid,
        numberOfItems: isRemoving ? validItems.length : addableItems.length,
      },
    );

    if (isRemoving) {
      removeItemsFromDownloads(validItems);
      return;
    }

    addItemsToDownloads(addableItems);
  };

  return (
    <Button
      variant={variant ?? (isRemoving ? "secondary" : "primary")}
      data-size={size}
      className={className}
      disabled={!isRemoving && addableItems.length === 0}
      onClick={handleToggleDownloads}
    >
      {isRemoving ? (
        <>
          <TrashIcon aria-hidden />
          {resolvedRemoveLabel}
        </>
      ) : (
        <>
          <DownloadIcon aria-hidden />
          {resolvedAddLabel}
        </>
      )}
    </Button>
  );
}
