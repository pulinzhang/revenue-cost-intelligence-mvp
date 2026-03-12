import { en } from "@/lib/i18n/dictionaries/en";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { lt } from "@/lib/i18n/dictionaries/lt";
import { zh } from "@/lib/i18n/dictionaries/zh";
import type { Locale } from "@/lib/i18n/locales";

// Keep this intentionally loose: translations are plain nested objects of strings.
export type Dictionary = Record<string, any>;

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  lt,
  zh,
  fr,
};
