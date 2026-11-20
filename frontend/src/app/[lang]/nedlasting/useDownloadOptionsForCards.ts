"use client";

import { useEffect, useRef, useState } from "react";
import { bffPath } from "@/lib/basePath";
import { parseDownloadOptions } from "@/lib/schemas/download";
import type { DownloadOptionsByUuid } from "./downloadUtils";

function getErrorMessage(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  return "Ukjent feil fra nedlastingstjenesten.";
}

export type DownloadOptionsCardInput = {
  uuid: string;
  capabilitiesUrl: string;
};

function buildOptionsUrl(uuid: string, capabilitiesUrl: string): string {
  const params = new URLSearchParams();
  if (capabilitiesUrl) params.set("capabilitiesUrl", capabilitiesUrl);
  const query = params.toString();
  return `${bffPath}/download/options/${encodeURIComponent(uuid)}${
    query ? `?${query}` : ""
  }`;
}

export function useDownloadOptionsForCards(
  cards: DownloadOptionsCardInput[],
): DownloadOptionsByUuid {
  const [optionsByUuid, setOptionsByUuid] = useState<DownloadOptionsByUuid>({});
  const requestedKeys = useRef(new Set<string>());
  const cardsKey = JSON.stringify(cards);

  useEffect(() => {
    const controller = new AbortController();
    const currentCards: DownloadOptionsCardInput[] = JSON.parse(cardsKey);
    const pendingKeys = new Set<string>();

    for (const { uuid, capabilitiesUrl } of currentCards) {
      const key = JSON.stringify({ uuid, capabilitiesUrl });
      if (requestedKeys.current.has(key)) continue;
      requestedKeys.current.add(key);
      pendingKeys.add(key);

      setOptionsByUuid((current) => ({
        ...current,
        [uuid]: { options: null, isLoading: true, error: null },
      }));

      fetch(buildOptionsUrl(uuid, capabilitiesUrl), {
        signal: controller.signal,
      })
        .then(async (response) => {
          pendingKeys.delete(key);
          const body: unknown = await response.json();

          if (!response.ok) {
            setOptionsByUuid((current) => ({
              ...current,
              [uuid]: {
                options: null,
                isLoading: false,
                error: getErrorMessage(body),
              },
            }));
            return;
          }

          setOptionsByUuid((current) => ({
            ...current,
            [uuid]: {
              options: parseDownloadOptions(body),
              isLoading: false,
              error: null,
            },
          }));
        })
        .catch((cause) => {
          pendingKeys.delete(key);
          if (controller.signal.aborted) return;

          console.error("Could not fetch download options", cause);
          setOptionsByUuid((current) => ({
            ...current,
            [uuid]: {
              options: null,
              isLoading: false,
              error:
                cause instanceof Error
                  ? cause.message
                  : "Ukjent feil fra nedlastingstjenesten.",
            },
          }));
        });
    }

    return () => {
      controller.abort();
      for (const key of pendingKeys) {
        requestedKeys.current.delete(key);
      }
    };
  }, [cardsKey]);

  return optionsByUuid;
}
