"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "downloadOrderInfo";

type PersistedOrderInfo = {
  usageGroup: string;
  usagePurpose: string[];
};

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function readStoredOrderInfo(): PersistedOrderInfo {
  if (typeof window === "undefined") {
    return { usageGroup: "", usagePurpose: [] };
  }

  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}",
    );

    if (typeof parsed !== "object" || parsed === null) {
      return { usageGroup: "", usagePurpose: [] };
    }

    const candidate = parsed as Record<string, unknown>;
    return {
      usageGroup:
        typeof candidate.usageGroup === "string" ? candidate.usageGroup : "",
      usagePurpose: isStringArray(candidate.usagePurpose)
        ? candidate.usagePurpose
        : [],
    };
  } catch {
    return { usageGroup: "", usagePurpose: [] };
  }
}

export function usePersistedOrderInfo() {
  const [orderInfo, setOrderInfo] = useState<PersistedOrderInfo>(() =>
    readStoredOrderInfo(),
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderInfo));
    } catch (error) {
      console.error("Kunne ikke lagre brukergruppe og formål", error);
    }
  }, [orderInfo]);

  function setUsageGroup(usageGroup: string) {
    setOrderInfo((current) => ({ ...current, usageGroup }));
  }

  function setUsagePurpose(usagePurpose: string[]) {
    setOrderInfo((current) => ({ ...current, usagePurpose }));
  }

  return {
    usageGroup: orderInfo.usageGroup,
    setUsageGroup,
    usagePurpose: orderInfo.usagePurpose,
    setUsagePurpose,
  };
}
