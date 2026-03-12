"use client";

import { localeNames, supportedLocales, type Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      <span className="hidden sm:inline">{t("common.language")}</span>
      <select
        className="h-9 rounded-md border bg-white px-2 text-sm text-zinc-900"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {supportedLocales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}

