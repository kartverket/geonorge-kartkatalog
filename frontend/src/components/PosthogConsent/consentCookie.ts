export type ConsentState = {
  analytics: boolean;
  functional: boolean;
  performance: boolean;
  advertisement: boolean;
};

export type ConsentCategories =
  | Record<string, unknown>
  | string[]
  | null
  | undefined;

export const DEFAULT_CONSENT: ConsentState = {
  analytics: false,
  functional: false,
  performance: false,
  advertisement: false,
};

export const CONSENT_COOKIE_NAME = "cookieyes-consent";

const consentCategoryKeys = Object.keys(DEFAULT_CONSENT) as Array<
  keyof ConsentState
>;

export function normalizeConsent({
  categories = {},
  accepted,
}: {
  categories?: ConsentCategories | null;
  accepted?: ConsentCategories | null;
} = {}): ConsentState {
  const acceptedValues = Array.isArray(accepted) ? accepted : null;
  const categoryValues =
    categories && !Array.isArray(categories) ? categories : null;

  return consentCategoryKeys.reduce<ConsentState>(
    (normalizedConsent, categoryKey) => {
      normalizedConsent[categoryKey] = acceptedValues
        ? acceptedValues.includes(categoryKey)
        : Boolean(categoryValues?.[categoryKey]);

      return normalizedConsent;
    },
    { ...DEFAULT_CONSENT },
  );
}

export function parseConsentCookieString(
  cookieString: string,
): ConsentState | null {
  const raw = cookieString
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!raw) return null;

  const value = decodeURIComponent(raw.slice(CONSENT_COOKIE_NAME.length + 1));
  const parts = new Map<string, string>();

  for (const pair of value.split(",")) {
    const idx = pair.indexOf(":");
    if (idx === -1) continue;
    parts.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }

  if (parts.get("action") !== "yes") return null;

  return consentCategoryKeys.reduce<ConsentState>(
    (state, key) => {
      state[key] = parts.get(key) === "yes";
      return state;
    },
    { ...DEFAULT_CONSENT },
  );
}

export function hasPerformanceConsentInCookieString(
  cookieString: string,
): boolean {
  return parseConsentCookieString(cookieString)?.performance === true;
}
