import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { env } from "@/lib/env";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { isLocale } from "@/lib/i18n/locales";

export const metadata: Metadata = {
  title: env.appName,
  description: "Revenue & Cost Intelligence Platform (MVP)",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value ?? null;
  const initialLang = isLocale(cookieLocale) ? cookieLocale : "en";
  return (
    <html lang={initialLang}>
      <body className="antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
