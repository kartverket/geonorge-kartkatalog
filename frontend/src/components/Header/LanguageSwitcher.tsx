"use client";

import { Button } from "@kv-designsystem/react";
import { LanguageIcon } from "@navikt/aksel-icons";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/I18nProvider";
import { basePath } from "@/lib/basePath";
import { LOCALE_COOKIE_NAME, type Locale, withLocale } from "@/lib/i18n";

const TARGET: Record<
  Locale,
  { locale: Locale; label: string; ariaLabel: string }
> = {
  no: {
    locale: "en",
    label: "English",
    ariaLabel: "Change language to English",
  },
  en: { locale: "no", label: "Norsk", ariaLabel: "Bytt språk til norsk" },
};

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function LanguageSwitcher({
  className,
  onSwitch,
}: {
  className?: string;
  onSwitch?: (locale: Locale) => void;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const target = TARGET[locale];
  const query = searchParams.toString();
  const href =
    `${withLocale(pathname, target.locale)}${query ? `?${query}` : ""}` as Route;

  return (
    <Button asChild variant="tertiary" className={className}>
      <Link
        href={href}
        hrefLang={target.locale}
        lang={target.locale}
        aria-label={target.ariaLabel}
        onClick={() => {
          // biome-ignore lint/suspicious/noDocumentCookie: simple preference cookie read by proxy.ts
          document.cookie = `${LOCALE_COOKIE_NAME}=${target.locale}; path=${basePath || "/"}; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
          onSwitch?.(target.locale);
        }}
      >
        <LanguageIcon aria-hidden />
        {target.label}
      </Link>
    </Button>
  );
}
