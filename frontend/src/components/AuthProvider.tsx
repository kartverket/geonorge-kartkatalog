"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { basePath } from "@/lib/basePath";
import { type AuthInfo, AuthSessionSchema } from "@/lib/schemas/auth";

export type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: AuthInfo }
  | { status: "error" };

const AuthContext = createContext<AuthState | null>(null);
const LOADING_AUTH_STATE: AuthState = { status: "loading" };

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(LOADING_AUTH_STATE);

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

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthInfo(): AuthState {
  const state = useContext(AuthContext);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  if (!state) {
    throw new Error("useAuthInfo must be used within AuthProvider");
  }
  return isHydrated ? state : LOADING_AUTH_STATE;
}
