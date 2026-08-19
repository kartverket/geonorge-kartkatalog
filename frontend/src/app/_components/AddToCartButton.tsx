"use client";

import type { ButtonProps } from "@kv-designsystem/react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import { useCallback, useEffect, useState } from "react";

export type DownloadItem = {
  distributionUrl: string | null;
  name: string;
  uuid: string;
};

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

  useEffect(() => {
    if (!item?.uuid) return;
    try {
      const parsed = JSON.parse(localStorage.getItem("orderItems") || "[]");
      const items = Array.isArray(parsed) ? parsed : [];
      setIsInCart(items.includes(item.uuid));
    } catch {
      setIsInCart(false);
    }
  }, [item?.uuid]);

  const handleToggleCart = useCallback(() => {
    if (!item?.uuid || !distributionUrl) return;
    const storedItem = { uuid: item.uuid, name: item.name, distributionUrl };

    setIsInCart((prev) => {
      try {
        const parsed = JSON.parse(localStorage.getItem("orderItems") || "[]");
        const selectedItems: string[] = Array.isArray(parsed) ? parsed : [];
        if (prev) {
          localStorage.setItem(
            "orderItems",
            JSON.stringify(selectedItems.filter((id) => id !== item.uuid)),
          );
          localStorage.removeItem(`${item.uuid}.metadata`);
        } else {
          if (!selectedItems.includes(item.uuid)) selectedItems.push(item.uuid);
          localStorage.setItem("orderItems", JSON.stringify(selectedItems));
          localStorage.setItem(
            `${item.uuid}.metadata`,
            JSON.stringify(storedItem),
          );
        }
        document.dispatchEvent(new Event("downloadItemsChanged"));
        return !prev;
      } catch {
        return prev;
      }
    });
  }, [item?.uuid, item?.name, distributionUrl]);

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
