"use client";

import { useState } from "react";
import { basePath } from "@/lib/basePath";
import {
  type DownloadOrderRequest,
  type DownloadOrderResult,
  parseDownloadOrderRequest,
  parseDownloadOrderResult,
} from "@/lib/schemas/download";

export function useDownloadOrder() {
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<DownloadOrderResult | null>(
    null,
  );

  async function submitOrder(
    request: DownloadOrderRequest,
  ): Promise<DownloadOrderResult | null> {
    setIsOrdering(true);
    setOrderError(null);
    setOrderResult(null);

    try {
      const payload = parseDownloadOrderRequest(request);
      const response = await fetch(`${basePath}/api/download/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Bestillingen feilet.");
      }

      const result: DownloadOrderResult = parseDownloadOrderResult(
        await response.json(),
      );
      setOrderResult(result);
      return result;
    } catch {
      setOrderError("Kunne ikke fullføre bestillingen. Prøv igjen.");
      return null;
    } finally {
      setIsOrdering(false);
    }
  }

  return { isOrdering, orderError, orderResult, submitOrder };
}
