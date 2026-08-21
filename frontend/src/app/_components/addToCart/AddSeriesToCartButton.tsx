"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addItemsToCart,
  areAnyItemsInCart,
  DOWNLOAD_ITEMS_CHANGED_EVENT,
  type DownloadItem,
  removeItemsFromCart,
} from "@/app/_components/addToCart/cartStorage";

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
  const [areItemsInCart, setAreItemsInCart] = useState(false);
  const downloadableItems = useMemo(
    () => items.filter((item) => item.uuid && item.distributionUrl),
    [items],
  );

  const syncState = useCallback(() => {
    setAreItemsInCart(areAnyItemsInCart(downloadableItems));
  }, [downloadableItems]);

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
    if (downloadableItems.length === 0) return;

    if (areItemsInCart) {
      removeItemsFromCart(downloadableItems);
      setAreItemsInCart(false);
      return;
    }

    addItemsToCart(downloadableItems);
    setAreItemsInCart(true);
  }, [areItemsInCart, downloadableItems]);

  if (downloadableItems.length === 0) return null;

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
