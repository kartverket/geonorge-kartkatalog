"use client";

import { useEffect, useRef, useState } from "react";
import { basePath } from "@/lib/basePath";
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

export function useDownloadOptionsForCards(
  uuids: string[],
): DownloadOptionsByUuid {
  const [optionsByUuid, setOptionsByUuid] = useState<DownloadOptionsByUuid>({});
  const requestedUuids = useRef(new Set<string>());
  const uuidsKey = uuids.join(",");

  useEffect(() => {
    const controller = new AbortController();
    const currentUuids = uuidsKey.length > 0 ? uuidsKey.split(",") : [];

    for (const uuid of currentUuids) {
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
          if (controller.signal.aborted) {
            requestedUuids.current.delete(uuid);
            return;
          }

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
  }, [uuidsKey]);

  return optionsByUuid;
}
