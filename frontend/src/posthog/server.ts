import "server-only";

import { getServerConsent } from "@cookieyes/nextjs/server";
import { cookies } from "next/headers";
import { PostHog } from "posthog-node";

let client: PostHog | undefined;

export async function getServerFeatureFlag(
  key: string,
  defaultValue?: boolean | string,
): Promise<boolean | string | undefined> {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token || !host) {
    console.warn(
      "PostHog feature flags unavailable: project token or host is missing",
    );
    return defaultValue;
  }

  const consent = await getServerConsent({ regulation: "GDPR" });
  if (!consent?.categories.analytics) return defaultValue;

  // Match the default cookie name used by posthog-js in instrumentation-client.ts.
  const cookieName = `ph_${token.replace(/\+/g, "PL").replace(/\//g, "SL").replace(/=/g, "EQ")}_posthog`;
  const persistence = (await cookies()).get(cookieName)?.value;
  if (!persistence) return defaultValue;

  let identity: unknown;
  try {
    identity = JSON.parse(persistence);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.warn("Invalid PostHog identity cookie", error);
    return defaultValue;
  }
  if (
    typeof identity !== "object" ||
    identity === null ||
    !("distinct_id" in identity) ||
    typeof identity.distinct_id !== "string" ||
    !identity.distinct_id
  ) {
    console.warn("PostHog identity cookie has no distinct ID");
    return defaultValue;
  }

  client ??= new PostHog(token, { host });
  try {
    const value = await client.getFeatureFlag(key, identity.distinct_id, {
      sendFeatureFlagEvents: false,
      disableGeoip: true,
    });
    if (value === undefined) {
      console.warn(`PostHog feature flag ${key} could not be evaluated`);
      return defaultValue;
    }
    return value;
  } catch (error) {
    console.error(`Failed to evaluate PostHog feature flag ${key}`, error);
    return defaultValue;
  }
}
