import type { Metadata } from "next";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import "./globals.css";
import OgHeader from "@/components/Header/OgHeader";
import { Suspense } from "react";
import HeaderWrapper from "@/components/Header/HeaderWrapper";

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
        <Suspense>
          <HeaderWrapper />
        </Suspense>
        <div  id="main-content">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
