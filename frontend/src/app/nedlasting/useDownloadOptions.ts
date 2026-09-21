"use client";

import { useEffect, useState } from "react";
import { basePath } from "@/lib/basePath";
import {
  type DownloadOptions,
  parseDownloadOptions,
} from "@/lib/schemas/download";

type DownloadOptionsState = {
  error: string | null;
  isLoading: boolean;
  options: DownloadOptions | null;
};

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

export function useDownloadOptions(
  uuid: string,
  enabled: boolean,
): DownloadOptionsState {
  const [options, setOptions] = useState<DownloadOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || options) return;

    let cancelled = false;

    async function loadOptions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${basePath}/api/download/options/${encodeURIComponent(uuid)}`,
        );
        const body: unknown = await response.json();

        if (!response.ok) {
          if (!cancelled) setError(getErrorMessage(body));
          return;
        }

        if (!cancelled) setOptions(parseDownloadOptions(body));
      } catch (cause) {
        if (cancelled) return;

        console.error("Could not fetch download options", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Ukjent feil fra nedlastingstjenesten.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [enabled, options, uuid]);

  return { error, isLoading, options };
}
