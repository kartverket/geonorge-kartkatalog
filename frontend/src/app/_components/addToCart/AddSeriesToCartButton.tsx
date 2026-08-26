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

export default function AddSeriesToCartButton({
  items,
  className,
  variant,
  size,
}: {
  items: DownloadItem[];
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
}) {
  const areItemsInCart = useAreAnyItemsInCart(items);

  const hasDownloadableItems = items.some(
    (item) => item.uuid && item.distributionUrl,
  );

  if (!hasDownloadableItems) return null;

  const handleToggleCart = () => {
    if (areItemsInCart) {
      removeItemsFromCart(items);
      return;
    }

    addItemsToCart(items);
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
