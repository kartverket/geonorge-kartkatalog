"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import { useCallback, useEffect, useState } from "react";
import {
  addItemsToCart,
  DOWNLOAD_ITEMS_CHANGED_EVENT,
  type DownloadItem,
  isItemInCart,
  removeItemsFromCart,
} from "@/app/_components/addToCart/cartStorage";

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
  const [isInCart, setIsInCart] = useState(false);
  const distributionUrl = item?.distributionUrl ?? null;

  const syncState = useCallback(() => {
    setIsInCart(item?.uuid ? isItemInCart(item.uuid) : false);
  }, [item?.uuid]);

  useEffect(() => {
    syncState();

    const handleCartChange = () => syncState();
    document.addEventListener(DOWNLOAD_ITEMS_CHANGED_EVENT, handleCartChange);

    return () => {
      document.removeEventListener(
        DOWNLOAD_ITEMS_CHANGED_EVENT,
        handleCartChange,
      );
    };
  }, [syncState]);

  const handleToggleCart = useCallback(() => {
    if (!item?.uuid || !distributionUrl) return;

    const cartItem = { uuid: item.uuid, name: item.name, distributionUrl };

    if (isInCart) {
      removeItemsFromCart([cartItem]);
      setIsInCart(false);
      return;
    }

    addItemsToCart([cartItem]);
    setIsInCart(true);
  }, [distributionUrl, isInCart, item?.name, item?.uuid]);

  if (!item) return null;

  if (!distributionUrl) return null;

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
