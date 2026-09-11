"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import type { MouseEvent } from "react";
import {
  addItemsToCart,
  type DownloadItem,
  removeItemsFromCart,
} from "@/app/_components/addToCart/cartStorage";
import { useIsItemInCart } from "@/app/_components/addToCart/useCart";
import { type Location, trackClick } from "@/posthog/posthog";

export default function AddToCartButton({
  item,
  className,
  variant,
  size,
  location,
  addLabel = "Legg til i handlekurv",
  removeLabel = "Fjern fra handlekurv",
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
  const isInCart = useIsItemInCart(item?.uuid);

  if (!item?.uuid || !item.distributionUrl) return null;

  const handleToggleCart = (event: MouseEvent<HTMLButtonElement>) => {
    if (preventAccordionToggle) {
      event.preventDefault();
      event.stopPropagation();
    }

    trackClick(isInCart ? "remove-from-cart" : "add-to-cart", location, {
      itemName: item.name,
      itemUuid: item.uuid,
    });

    if (isInCart) {
      removeItemsFromCart([item]);
      return;
    }

    addItemsToCart([item]);
  };

  return (
    <Button
      data-color="neutral"
      variant={variant}
      data-size={size}
      className={className}
      onClick={handleToggleCart}
    >
      {isInCart ? (
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
