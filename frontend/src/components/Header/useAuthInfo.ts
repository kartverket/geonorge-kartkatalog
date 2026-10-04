import { useEffect, useState } from "react";
import { basePath } from "@/lib/basePath";
import { type AuthInfo, AuthSessionSchema } from "@/lib/schemas/auth";

export type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: AuthInfo }
  | { status: "error" };

export function useAuthInfo(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadAuthInfo() {
      try {
        const response = await fetch(`${basePath}/api/me`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          setState({ status: "error" });
          return;
        }

        const session = AuthSessionSchema.parse(await response.json());
        setState(
          session.authenticated
            ? { status: "authenticated", user: session.user }
            : { status: "anonymous" },
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState({ status: "error" });
      }
    }

    loadAuthInfo();
    return () => controller.abort();
  }, []);

  return state;
}
