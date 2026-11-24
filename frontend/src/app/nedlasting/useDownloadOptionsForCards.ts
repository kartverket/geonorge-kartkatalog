"use client";

import { useEffect, useRef, useState } from "react";
import { bffPath } from "@/lib/basePath";
import { parseDownloadOptions } from "@/lib/schemas/download";
import type { DownloadOptionsByUuid } from "./downloadUtils";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

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
  const settledKeys = useRef(new Set<string>());
  const attemptsByKey = useRef(new Map<string, number>());
  const cardsKey = JSON.stringify(cards);

  useEffect(() => {
    const controller = new AbortController();
    const currentCards: DownloadOptionsCardInput[] = JSON.parse(cardsKey);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function fetchOptions(uuid: string, capabilitiesUrl: string, key: string) {
      setOptionsByUuid((current) => ({
        ...current,
        [uuid]: { options: null, isLoading: true, error: null },
      }));

      fetch(buildOptionsUrl(uuid, capabilitiesUrl), {
        signal: controller.signal,
      })
        .then(async (response) => {
          const body: unknown = await response.json();

          if (!response.ok) {
            throw new Error(getErrorMessage(body));
          }

          const options = parseDownloadOptions(body);
          if (options.areas.length === 0) {
            throw new Error(
              "Ingen tilgjengelige områder for dette datasettet.",
            );
          }

          settledKeys.current.add(key);
          attemptsByKey.current.delete(key);
          setOptionsByUuid((current) => ({
            ...current,
            [uuid]: { options, isLoading: false, error: null },
          }));
        })
        .catch((cause) => {
          if (controller.signal.aborted) return;

          const attempts = (attemptsByKey.current.get(key) ?? 0) + 1;
          attemptsByKey.current.set(key, attempts);

          if (attempts < MAX_ATTEMPTS) {
            timeouts.push(
              setTimeout(() => {
                fetchOptions(uuid, capabilitiesUrl, key);
              }, RETRY_DELAY_MS * attempts),
            );
            return;
          }

          console.error("Could not fetch download options", cause);
          settledKeys.current.add(key);
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

    for (const { uuid, capabilitiesUrl } of currentCards) {
      const key = JSON.stringify({ uuid, capabilitiesUrl });
      if (settledKeys.current.has(key)) continue;
      fetchOptions(uuid, capabilitiesUrl, key);
    }

    return () => {
      controller.abort();
      for (const timeout of timeouts) clearTimeout(timeout);
    };
  }, [cardsKey]);

  return optionsByUuid;
}
