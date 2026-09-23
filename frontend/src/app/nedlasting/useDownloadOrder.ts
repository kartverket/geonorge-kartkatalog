"use client";

import { useState } from "react";
import { basePath } from "@/lib/basePath";
import {
  type DownloadOrderItemInput,
  type DownloadOrderResult,
  parseDownloadOrderResult,
} from "@/lib/schemas/download";

export function useDownloadOrder() {
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<DownloadOrderResult | null>(
    null,
  );

  async function submitOrder(items: DownloadOrderItemInput[]) {
    setIsOrdering(true);
    setOrderError(null);
    setOrderResult(null);

    try {
      const response = await fetch(`${basePath}/api/download/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error("Bestillingen feilet.");
      }

      const result: DownloadOrderResult = parseDownloadOrderResult(
        await response.json(),
      );
      setOrderResult(result);
    } catch {
      setOrderError("Kunne ikke fullføre bestillingen. Prøv igjen.");
    } finally {
      setIsOrdering(false);
    }
  }

  return { isOrdering, orderError, orderResult, submitOrder };
}
