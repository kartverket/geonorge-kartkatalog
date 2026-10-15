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
import { useIsItemSelectedForDownload } from "@/app/_components/addToDownloads/useDownloads";
import { useAuthInfo } from "@/components/AuthProvider";
import { type Location, trackClick } from "@/posthog/posthog";

export default function AddToDownloadsButton({
  item,
  className,
  variant,
  size,
  location,
  addLabel = "Legg til nedlasting",
  removeLabel = "Fjern fra nedlasting",
  preventAccordionToggle = false,
}: {
  item: DownloadItem | null;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
  location: Location;
  addLabel?: string;
  removeLabel?: string;
  preventAccordionToggle?: boolean;
}) {
  const authState = useAuthInfo();
  const isSelectedForDownload = useIsItemSelectedForDownload(item?.uuid);
  const canAdd =
    item?.accessType?.toLocaleLowerCase() === "open" ||
    authState.status === "authenticated";

  if (!item?.uuid || !item.distributionUrl) {
    return null;
  }

  const handleToggleDownloads = (event: MouseEvent<HTMLButtonElement>) => {
    if (preventAccordionToggle) {
      event.preventDefault();
      event.stopPropagation();
    }

    trackClick(
      isSelectedForDownload ? "remove-from-downloads" : "add-to-downloads",
      location,
      {
        itemName: item.name,
        itemUuid: item.uuid,
      },
    );

    if (isSelectedForDownload) {
      removeItemsFromDownloads([item]);
      return;
    }

    addItemsToDownloads([item]);
  };

  return (
    <Button
      variant={variant ?? (isSelectedForDownload ? "secondary" : "primary")}
      data-size={size}
      className={className}
      disabled={!isSelectedForDownload && !canAdd}
      onClick={handleToggleDownloads}
    >
      {isSelectedForDownload ? (
        <>
          <TrashIcon aria-hidden />
          {removeLabel}
        </>
      ) : (
        <>
          <DownloadIcon aria-hidden />
          {addLabel}
        </>
      )}
    </Button>
  );
}
