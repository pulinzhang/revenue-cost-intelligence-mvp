"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

export function EntriesClientHeader() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("entries.title")}</h1>
      <p className="mt-1 text-sm text-zinc-600">{t("entries.subtitle")}</p>
    </div>
  );
}

