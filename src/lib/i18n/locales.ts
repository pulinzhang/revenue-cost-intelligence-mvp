export const supportedLocales = ["en", "lt", "zh", "fr"] as const;
export type Locale = (typeof supportedLocales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  lt: "Lietuvių",
  zh: "中文",
  fr: "Français",
};

export function isLocale(v: string | null | undefined): v is Locale {
  return supportedLocales.includes(v as Locale);
}
