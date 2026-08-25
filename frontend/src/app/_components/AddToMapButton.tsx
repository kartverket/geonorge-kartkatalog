"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import { useCallback, useEffect, useState } from "react";

export type MapItem = {
  DistributionProtocol: string;
  GetCapabilitiesUrl: string | null;
  Title: string;
  Uuid: string;
  addLayers: string[];
};

export default function AddToMapButton({
  item,
  className,
  variant,
  size,
}: {
  item: MapItem | null;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
}) {
  const [isInMap, setIsInMap] = useState(false);

  useEffect(() => {
    if (!item) return;

    try {
      const parsed = JSON.parse(localStorage.getItem("mapItems") || "[]");
      const items = Array.isArray(parsed) ? parsed : [];
      setIsInMap(items.some((mapItem) => mapItem.Uuid === item.Uuid));
    } catch {
      setIsInMap(false);
    }
  }, [item]);

  const handleToggleMap = useCallback(() => {
    if (!item) return;

    setIsInMap((prev) => {
      try {
        const parsed = JSON.parse(localStorage.getItem("mapItems") || "[]");
        const selectedItems: MapItem[] = Array.isArray(parsed) ? parsed : [];
        if (prev) {
          localStorage.setItem(
            "mapItems",
            JSON.stringify(
              selectedItems.filter((mapItem) => mapItem.Uuid !== item.Uuid),
            ),
          );
        } else {
          if (!selectedItems.some((mapItem) => mapItem.Uuid === item.Uuid)) {
            selectedItems.push(item);
          }
          localStorage.setItem("mapItems", JSON.stringify(selectedItems));
        }
        document.dispatchEvent(new Event("mapItemsChanged"));
        return !prev;
      } catch {
        return prev;
      }
    });
  }, [item]);

  if (!item) return null;

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
