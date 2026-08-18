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

function getGeonorgeDownloadUrl(distributionGroups: DistributionGroup[]): string | null {
  const group = distributionGroups.find((g) => g.protocol === "GEONORGE:DOWNLOAD");
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
    if (!item?.uuid) return;

    const distributionUrl = getGeonorgeDownloadUrl(item.distributionGroups);
    if (!distributionUrl) return;

    const storedItem = { uuid: item.uuid, name: item.name, distributionUrl };

    try {
      const parsed = JSON.parse(localStorage.getItem("orderItems") || "[]");
      const selectedItems: string[] = Array.isArray(parsed) ? parsed : [];

      if (isInCart) {
        const updated = selectedItems.filter((id) => id !== item.uuid);
        localStorage.setItem("orderItems", JSON.stringify(updated));
        setIsInCart(false);
      } else {
        if (!selectedItems.includes(item.uuid)) {
          selectedItems.push(item.uuid);
        }
        localStorage.setItem("orderItems", JSON.stringify(selectedItems));
        localStorage.setItem(`${item.uuid}.metadata`, JSON.stringify(storedItem));

        setIsInCart(true);
        document.dispatchEvent(new Event("downloadItemsChanged"));
      }
    } catch {
      localStorage.setItem(`${item.uuid}.metadata`, JSON.stringify(storedItem));
    }
  }, [item, isInCart]);

  if (!item) return null;

  const distributionUrl = getGeonorgeDownloadUrl(item.distributionGroups);
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
