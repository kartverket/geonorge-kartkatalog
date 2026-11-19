"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/dictionary";

type I18nContextValue = { locale: Locale; dictionary: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: I18nContextValue & { children: ReactNode }) {
  return <I18nContext value={{ locale, dictionary }}>{children}</I18nContext>;
}

function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function useDictionary(): Dictionary {
  return useI18n().dictionary;
}

export function useLocale(): Locale {
  return useI18n().locale;
}
