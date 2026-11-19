import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { LegacyBanner } from "@/components/LegacyBanner/LegacyBanner";
import "../globals.css";
import { CookieYesProvider } from "@cookieyes/nextjs";
import { getServerConsent } from "@cookieyes/nextjs/server";
import { Suspense } from "react";
import { CookieYesRoot } from "@/components/consent-manager";
import { I18nProvider } from "@/components/I18nProvider";
import { isBeta } from "@/lib/basePath";
import { LOCALES } from "@/lib/i18n";
import { getDictionary, getLocale } from "./dictionaries";

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();
  return {
    title: {
      template: metadata.titleTemplate,
      default: metadata.title,
    },
    description: metadata.description,
  };
}

export const instant = false;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [initialConsent, locale, dictionary] = await Promise.all([
    getServerConsent({ regulation: "GDPR" }),
    getLocale(),
    getDictionary(),
  ]);

  return (
    <html lang={locale}>
      <head>
        <link
          rel="stylesheet"
          href="https://altinncdn.no/fonts/inter/v4.1/inter.css"
          integrity="sha384-OcHzc/By/OPw9uJREawUCjP2inbOGKtKb4A/I2iXxmknUfog2H8Adx71tWVZRscD"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <CookieYesProvider regulation="GDPR" initialConsent={initialConsent}>
          <CookieYesRoot />
        </CookieYesProvider>
        <I18nProvider locale={locale} dictionary={dictionary}>
          <AuthProvider>
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            {isBeta && <LegacyBanner />}
            {children}
            <Footer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
