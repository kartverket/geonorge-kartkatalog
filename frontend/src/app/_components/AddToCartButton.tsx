"use client";

import { useCallback } from "react";
import { Button } from "@kv-designsystem/react";
import { DownloadIcon } from "@navikt/aksel-icons";

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
  const handleAddToCart = useCallback(() => {
    if (!item?.uuid) return;

    try {
      // 1) Read existing UUID order list
      const selectedItems = (() => {
        try {
          const parsed = JSON.parse(localStorage.getItem("orderItems") || "[]");
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      // 2) Avoid duplicates (optional, but usually desired)
      if (!selectedItems.includes(item.uuid)) {
        selectedItems.push(item.uuid);
      }

      // 3) Persist order list
      localStorage.setItem("orderItems", JSON.stringify(selectedItems));

      // 4) Persist full metadata object under "<uuid>.metadata"
      // localStorage.setItem(`${item.uuid}.metadata`, JSON.stringify(item));

      // Optional: notify other UI parts
      // document.dispatchEvent(new Event("downloadItemsChanged"));
    } catch (e) {
      // Fallback if localStorage quota is exceeded
      const slimItem = { ...item, areas: {} };
      localStorage.setItem(`${item.uuid}.metadata`, JSON.stringify(slimItem));
    }
  }, [item]);

  return (
    <Button
      data-color="neutral"
      className={className}
      onClick={handleAddToCart}
    >
      <DownloadIcon aria-hidden />
      Legg til i handlekurv
    </Button>
  );
}
