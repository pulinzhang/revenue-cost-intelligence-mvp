"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: any, k) => (acc == null ? undefined : acc[k]), obj as any);
}

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const raw = m?.[1] ? decodeURIComponent(m[1]) : null;
  return isLocale(raw) ? raw : null;
}

function writeCookieLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  // 1 year
  document.cookie = `locale=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
}

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("locale");
  return isLocale(raw) ? raw : null;
}

function writeStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("locale", locale);
}

function applyDocumentLang(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, _setLocale] = useState<Locale>("en");

  useEffect(() => {
    const fromStorage = readStoredLocale();
    const fromCookie = readCookieLocale();
    const initial = fromStorage ?? fromCookie ?? "en";
    _setLocale(initial);
    applyDocumentLang(initial);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    _setLocale(l);
    writeStoredLocale(l);
    writeCookieLocale(l);
    applyDocumentLang(l);
  }, []);

  const dict: Dictionary = useMemo(() => dictionaries[locale] ?? dictionaries.en, [locale]);

  const t = useCallback(
    (key: string) => {
      const v = getByPath(dict, key);
      if (typeof v === "string") return v;
      const fallback = getByPath(dictionaries.en, key);
      if (typeof fallback === "string") return fallback;
      return key;
    },
    [dict],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
