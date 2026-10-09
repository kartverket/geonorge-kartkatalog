"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { bffPath } from "@/lib/basePath";
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
        const requestOptions = {
          cache: "no-store" as const,
          headers: { Accept: "application/json" },
          signal: controller.signal,
        };
        const ansattportenResponse = await fetch(
          `${bffPath}/me`,
          requestOptions,
        );
        if (!ansattportenResponse.ok && ansattportenResponse.status !== 401) {
          setState({ status: "error" });
          return;
        }
        const ansattportenSession = ansattportenResponse.ok
          ? AuthSessionSchema.parse(await ansattportenResponse.json())
          : null;

        if (ansattportenSession?.authenticated) {
          setState({ status: "authenticated", user: ansattportenSession.user });
          return;
        }

        const geoIdResponse = await fetch(
          `${bffPath}/me/geoid`,
          requestOptions,
        );
        if (!geoIdResponse.ok) {
          setState({ status: "error" });
          return;
        }

        const session = AuthSessionSchema.parse(await geoIdResponse.json());
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
