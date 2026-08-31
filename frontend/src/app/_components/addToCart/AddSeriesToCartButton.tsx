"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import {
  addItemsToCart,
  type DownloadItem,
  removeItemsFromCart,
} from "@/app/_components/addToCart/cartStorage";
import { useAreAnyItemsInCart } from "@/app/_components/addToCart/useCart";
import type { ProductMetadata } from "@/lib/schemas/product";
import { type Location, trackClick } from "@/posthog/posthog";

export default function AddSeriesToCartButton({
  item,
  downloadableItems,
  className,
  variant,
  size,
  location,
}: {
  item: ProductMetadata & {
    uuid: string;
  };
  downloadableItems: DownloadItem[];
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
  location: Location;
}) {
  const areItemsInCart = useAreAnyItemsInCart(downloadableItems);

  const hasDownloadableItems = downloadableItems.some(
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
        numberOfItems: downloadableItems.length,
      },
    );

    if (areItemsInCart) {
      removeItemsFromCart(downloadableItems);
      return;
    }

    addItemsToCart(downloadableItems);
  };

  return (
    <Button
      data-color="neutral"
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
