"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { LayerMinusIcon, LayersPlusIcon } from "@navikt/aksel-icons";
import {
  addItemToMap,
  type MapItem,
  removeItemFromMap,
} from "@/app/_components/addToMap/mapStorage";
import { useIsItemInMap } from "@/app/_components/addToMap/useMap";
import { useDictionary } from "@/components/I18nProvider";
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
  const t = useDictionary().addToMap;

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
      variant={variant}
      data-size={size}
      className={className}
      onClick={handleToggleMap}
    >
      {isInMap ? (
        <>
          <LayerMinusIcon aria-hidden />
          {t.remove}
        </>
      ) : (
        <>
          <LayersPlusIcon aria-hidden />
          {t.add}
        </>
      )}
    </Button>
  );
}
