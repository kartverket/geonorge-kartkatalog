import type { Metadata } from "next";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { LegacyBanner } from "@/components/LegacyBanner/LegacyBanner";
import "./globals.css";
import { isBeta } from "@/lib/basePath";

export const metadata: Metadata = {
  title: {
    template: "%s | Kartkatalogen",
    default: "Kartkatalogen",
  },
  description: "Kartkatalogen | Geonorge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <head>
        <link
          rel="stylesheet"
          href="https://altinncdn.no/fonts/inter/v4.1/inter.css"
          integrity="sha384-OcHzc/By/OPw9uJREawUCjP2inbOGKtKb4A/I2iXxmknUfog2H8Adx71tWVZRscD"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Header />
        {isBeta && <LegacyBanner />}
        {children}
        <Footer />
      </body>
    </html>
  );
}
