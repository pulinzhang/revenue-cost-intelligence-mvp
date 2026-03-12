"use client";

import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function AppUserMenu({ email }: { email?: string | null }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-zinc-600">{email ?? "—"}</span>
      <button
        className="rounded-md border px-3 py-1.5 hover:bg-zinc-50"
        onClick={() => signOut({ callbackUrl: "/login" })}
        type="button"
      >
        {t("auth.signOut")}
      </button>
    </div>
  );
}
