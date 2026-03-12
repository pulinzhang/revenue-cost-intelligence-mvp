"use client";

import Link from "next/link";
import { AppUserMenu } from "@/components/AppUserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function AppHeader({ email }: { email?: string | null }) {
  const { t } = useI18n();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex w-full max-w-none items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold">
            {t("app.name")}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-600">
            <Link className="hover:text-zinc-900" href="/dashboard">
              {t("nav.dashboard")}
            </Link>
            <Link className="hover:text-zinc-900" href="/finance">
              {t("nav.finance")}
            </Link>
            <Link className="hover:text-zinc-900" href="/entries">
              {t("nav.entries")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <AppUserMenu email={email} />
        </div>
      </div>
    </header>
  );
}
