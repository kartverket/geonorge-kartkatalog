"use client";

import { useEffect, useRef, useState } from "react";
import { basePath } from "@/lib/basePath";
import {
  type DownloadOptions,
  parseDownloadOptions,
} from "@/lib/schemas/download";

export type DownloadOptionsState = {
  options: DownloadOptions | null;
  isLoading: boolean;
  error: string | null;
};

export type DownloadOptionsByUuid = Record<string, DownloadOptionsState>;

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

export function useDownloadOptionsForCards(
  uuids: string[],
): DownloadOptionsByUuid {
  const [optionsByUuid, setOptionsByUuid] = useState<DownloadOptionsByUuid>({});
  const requestedUuids = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();

    for (const uuid of uuids) {
      if (requestedUuids.current.has(uuid)) continue;
      requestedUuids.current.add(uuid);

      setOptionsByUuid((current) => ({
        ...current,
        [uuid]: { options: null, isLoading: true, error: null },
      }));

      fetch(`${basePath}/api/download/options/${encodeURIComponent(uuid)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
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

    return () => controller.abort();
  }, [uuids]);

  return optionsByUuid;
}
