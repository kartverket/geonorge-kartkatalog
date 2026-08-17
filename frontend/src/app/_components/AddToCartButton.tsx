"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon, TrashIcon } from "@navikt/aksel-icons";

export type DownloadProjection = {
  code: string;
  name: string;
};

export type DownloadFormat = {
  name: string;
  projections: DownloadProjection[];
};

export type DownloadArea = {
  type: string;
  name: string;
  code: string;
};

export type DownloadCapabilities = {
  supportsProjectionSelection: boolean;
  supportsFormatSelection: boolean;
  supportsPolygonSelection: boolean;
};

export type DownloadItem = {
  accessIsOpendata: boolean;
  accessIsRestricted: boolean;
  areas: DownloadArea[];
  canDownloadUrl: string;
  capabilities: DownloadCapabilities;
  distributionUrl: string;
  formats: DownloadFormat[];
  getCapabilitiesUrl: string;
  name: string;
  orderDistributionUrl: string;
  organizationName: string;
  projections: DownloadProjection[];
  theme: string;
  url: string;
  uuid: string;
};

export default function AddToCartButton({
  item,
  className,
}: {
  item: DownloadItem;
  className?: string;
}) {
  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("orderItems") || "[]");
      const items = Array.isArray(parsed) ? parsed : [];
      setIsInCart(items.includes(item.uuid));
    } catch {
      setIsInCart(false);
    }
  }, [item.uuid]);

  const handleToggleCart = useCallback(() => {
    if (!item?.uuid) return;

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
        setIsInCart(true);
      }
    } catch (e) {
      const slimItem = { ...item, areas: {} };
      localStorage.setItem(`${item.uuid}.metadata`, JSON.stringify(slimItem));
    }
  }, [item, isInCart]);

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
