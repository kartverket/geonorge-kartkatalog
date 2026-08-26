"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import {
  addItemsToCart,
  type DownloadItem,
  removeItemsFromCart,
} from "@/app/_components/addToCart/cartStorage";
import { useIsItemInCart } from "@/app/_components/addToCart/useCart";

export default function AddToCartButton({
  item,
  className,
  variant,
  size,
}: {
  item: DownloadItem | null;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: "sm" | "md" | "lg";
}) {
  const isInCart = useIsItemInCart(item?.uuid);

  if (!item?.uuid || !item.distributionUrl) return null;

  const handleToggleCart = () => {
    if (isInCart) {
      removeItemsFromCart([item]);
      return;
    }

    addItemsToCart([item]);
  };

  return (
    <Button
      data-color={"neutral"}
      variant={variant}
      data-size={size}
      className={className}
      onClick={handleToggleCart}
    >
      {isInCart ? (
        <>
          <TrashIcon aria-hidden />
          Fjern fra handlekurv
        </>
      ) : (
        <>
          <DownloadIcon aria-hidden />
          Legg til i handlekurv
        </>
      )}
    </Button>
  );
}
