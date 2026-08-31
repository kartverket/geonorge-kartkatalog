"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import {
  addItemToMap,
  type MapItem,
  removeItemFromMap,
} from "@/app/_components/addToMap/mapStorage";
import { useIsItemInMap } from "@/app/_components/addToMap/useMap";
import { type Location, trackClick } from "@/posthog/posthog";

export default function AddToMapButton({
  item,
  className,
  variant,
  size,
  location,
}: {
  item: MapItem | null;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
  location: Location;
}) {
  const isInMap = useIsItemInMap(item?.Uuid);

  if (!item?.Uuid) return null;

  const handleToggleMap = () => {
    trackClick(isInMap ? "remove-from-map" : "add-to-map", location, {
      itemName: item.Title,
      itemUuid: item.Uuid,
    });

    if (isInMap) {
      removeItemFromMap(item);
      return;
    }

    addItemToMap(item);
  };

  return (
    <Button
      data-color={"neutral"}
      variant={variant}
      data-size={size}
      className={className}
      onClick={handleToggleMap}
    >
      {isInMap ? (
        <>
          <TrashIcon aria-hidden />
          Fjern fra kart
        </>
      ) : (
        <>
          <DownloadIcon aria-hidden />
          Legg til i kart
        </>
      )}
    </Button>
  );
}
