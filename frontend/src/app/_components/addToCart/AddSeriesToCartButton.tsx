"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import {
  addItemsToCart,
  type DownloadItem,
  removeItemsFromCart,
} from "@/app/_components/addToCart/cartStorage";
import { useAreAllItemsInCart } from "@/app/_components/addToCart/useCart";
import { type Location, trackClick } from "@/posthog/posthog";
import type { DatasetCardProps } from "../DatasetCard/DatasetCard";

//Note, can only add open data here. In future, handle closed datasets when login is ok.
export default function AddSeriesToCartButton({
  item,
  downloadableItems,
  className,
  variant,
  size,
  location,
}: {
  item: Omit<
    DatasetCardProps, "viewMode"
  >;
  downloadableItems: DownloadItem[];
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
  location: Location;
}) {
  const addableItems = downloadableItems.filter((i) => i.accessType === "open");
  const areItemsInCart = useAreAllItemsInCart(addableItems);

  const hasDownloadableItems = addableItems.some(
    (item) => item.uuid && item.distributionUrl,
  );

  if (!hasDownloadableItems) return null;

  const handleToggleCart = () => {
    trackClick(
      areItemsInCart ? "remove-all-from-cart" : "add-all-to-cart",
      location,
      {
        itemName: item.title,
        itemUuid: item.uuid,
        numberOfItems: addableItems.length,
      },
    );

    if (areItemsInCart) {
      removeItemsFromCart(addableItems);
      return;
    }

    addItemsToCart(addableItems);
  };

  return (
    <Button
      variant={variant}
      data-size={size}
      className={className}
      onClick={handleToggleCart}
    >
      {areItemsInCart ? (
        <>
          <TrashIcon aria-hidden />
          Fjern alle fra handlekurv
        </>
      ) : (
        <>
          <DownloadIcon aria-hidden />
          Legg alle i handlekurv
        </>
      )}
    </Button>
  );
}
