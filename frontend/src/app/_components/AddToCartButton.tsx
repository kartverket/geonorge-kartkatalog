"use client";

import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";
import { useCallback, useEffect, useState } from "react";
import type { DistributionGroup } from "@/lib/schemas/product";

export type DownloadItem = {
  distributionGroups: DistributionGroup[];
  name: string;
  uuid: string;
};

function getGeonorgeDownloadUrl(
  distributionGroups: DistributionGroup[] | undefined,
): string | null {
  if (!distributionGroups) return null;
  const group = distributionGroups.find(
    (g) => g.protocol === "GEONORGE:DOWNLOAD",
  );
  const rawUrl = group?.formats[0]?.urls[0];
  if (!rawUrl) return null;
  const stripped = rawUrl.replace(/\/+$/, "");
  const lastSlash = stripped.lastIndexOf("/");
  return lastSlash !== -1 ? stripped.substring(0, lastSlash + 1) : rawUrl;
}

export default function AddToCartButton({
  item,
  className,
}: {
  item: DownloadItem | null;
  className?: string;
}) {
  const [isInCart, setIsInCart] = useState(false);
  const distributionUrl = getGeonorgeDownloadUrl(item?.distributionGroups);

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
