"use client";

import { useState } from "react";
import type { AuthProvider } from "@/lib/authProvider";
import { bffPath } from "@/lib/basePath";
import {
  type DownloadOrderRequest,
  type DownloadOrderResult,
  parseDownloadOrderRequest,
  parseDownloadOrderResult,
} from "@/lib/schemas/download";
import { LOCATIONS, trackEvent } from "@/posthog/posthog";

const DEFAULT_ORDER_ERROR = "Kunne ikke fullføre bestillingen. Prøv igjen.";

const ORDER_ERROR_BY_STATUS: Record<number, string> = {
  400: "Bestillingen inneholder ugyldige valg. Sjekk valgene dine og prøv igjen.",
  401: "Du må være logget inn for å bestille begrensede datasett. Logg inn og prøv igjen.",
  502: "Nedlastingstjenesten svarte ikke som forventet. Prøv igjen senere.",
};

const NETWORK_ORDER_ERROR =
  "Fikk ikke kontakt med tjenesten. Sjekk nettforbindelsen og prøv igjen.";

function getErrorCode(responseText: string): string | null {
  try {
    const body: unknown = JSON.parse(responseText);
    return typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
      ? body.error
      : null;
  } catch {
    return null;
  }
}

export function useDownloadOrder() {
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<DownloadOrderResult | null>(
    null,
  );

  function failOrder(message: string, status: number | null, cause: unknown) {
    console.error("Bestillingen feilet", { status, cause });
    trackEvent("download-order-failed", {
      location: LOCATIONS.DownloadPage,
      status,
    });
    setOrderError(message);
  }

  async function submitOrder(
    request: DownloadOrderRequest,
    provider: AuthProvider | null,
  ): Promise<DownloadOrderResult | null> {
    setIsOrdering(true);
    setOrderError(null);
    setOrderResult(null);

    try {
      const payload = parseDownloadOrderRequest(request);
      const endpoint =
        provider === "ansattporten" || provider === "mock"
          ? "/download/order-restricted"
          : "/download/order";

      const postOrder = () =>
        fetch(`${bffPath}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

      let response = await postOrder();

      if (!response.ok) {
        const errorText = await response.text();

        if (
          response.status === 401 &&
          getErrorCode(errorText) === "invalid_session"
        ) {
          // Forrige forsøk ble avvist pga. en ødelagt sesjon på serveren (som nå
          // er ryddet opp i), og rakk aldri å opprette noen bestilling - trygt å
          // prøve igjen.
          response = await postOrder();
        } else {
          failOrder(
            ORDER_ERROR_BY_STATUS[response.status] ?? DEFAULT_ORDER_ERROR,
            response.status,
            errorText,
          );
          return null;
        }
      }

      if (!response.ok) {
        failOrder(
          ORDER_ERROR_BY_STATUS[response.status] ?? DEFAULT_ORDER_ERROR,
          response.status,
          await response.text(),
        );
        return null;
      }

      const result: DownloadOrderResult = parseDownloadOrderResult(
        await response.json(),
      );
      setOrderResult(result);
      return result;
    } catch (error) {
      // fetch kaster TypeError når nettverkskallet i seg selv feiler
      failOrder(
        error instanceof TypeError ? NETWORK_ORDER_ERROR : DEFAULT_ORDER_ERROR,
        null,
        error,
      );
      return null;
    } finally {
      setIsOrdering(false);
    }
  }

  function resetOrder() {
    setOrderError(null);
    setOrderResult(null);
  }

  return { isOrdering, orderError, orderResult, submitOrder, resetOrder };
}
