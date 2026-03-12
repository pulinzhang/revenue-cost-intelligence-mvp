"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { ApiFetchError, apiFetch, issuesToFieldErrors } from "@/lib/apiFetch";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LoginClient({ azureEnabled }: { azureEnabled: boolean }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string[]>>({});

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div>
          <h1 className="text-2xl font-semibold">{t("auth.signIn")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t("auth.useSsoOrLocal")}</p>
        </div>

        <div className="rounded-xl border bg-white p-6">
          {loginError ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {loginError}
            </div>
          ) : null}
          <div className="mb-4 rounded-md border bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <div className="font-medium">Local admin (seed)</div>
            <div className="mt-1">
              Email: <span className="font-mono">admin2@example.com</span>
            </div>
            <div>
              Password: <span className="font-mono">admin123</span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              These values are prefilled below.
            </div>
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setLoginError(null);
              try {
                const form = new FormData(e.currentTarget as HTMLFormElement);
                const result = await signIn("credentials", {
                  email: String(form.get("email") ?? ""),
                  password: String(form.get("password") ?? ""),
                  callbackUrl: "/dashboard",
                  redirect: false,
                });
                if (result?.error) setLoginError(t("auth.invalidEmailOrPassword"));
                else if (result?.url) window.location.assign(result.url);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("auth.email")}</span>
              <input
                name="email"
                type="email"
                required
                defaultValue="admin2@example.com"
                className="rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("auth.password")}</span>
              <input
                name="password"
                type="password"
                required
                defaultValue="admin123"
                className="rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </label>
            <button
              disabled={busy}
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {t("auth.signIn")}
            </button>
          </form>

          <div className="my-6 h-px bg-zinc-100" />

          {azureEnabled ? (
            <button
              disabled={busy}
              onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
              type="button"
              className="w-full rounded-md border px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              {t("auth.signInWithAzure")}
            </button>
          ) : (
            <div className="text-sm text-zinc-500">{t("auth.azureNotConfigured")}</div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-sm font-semibold">{t("auth.createLocalAccount")}</h2>
          <p className="mt-1 text-sm text-zinc-600">{t("auth.forMvpTestingOnly")}</p>
          {registerError ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {registerError}
            </div>
          ) : null}
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setRegisterError(null);
              setRegisterFieldErrors({});
              try {
                const form = new FormData(e.currentTarget as HTMLFormElement);
                await apiFetch<{ ok: true }>("/api/auth/register", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    email: String(form.get("email") ?? ""),
                    password: String(form.get("password") ?? ""),
                  }),
                });
              } catch (err) {
                if (err instanceof ApiFetchError) {
                  setRegisterError(err.message);
                  setRegisterFieldErrors(issuesToFieldErrors(err.details));
                } else {
                  setRegisterError(t("common.requestFailed"));
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("auth.email")}</span>
              <input name="email" type="email" required className="rounded-md border px-3 py-2" />
              {registerFieldErrors["email"]?.length ? (
                <div className="text-xs text-red-700">{registerFieldErrors["email"][0]}</div>
              ) : null}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("auth.password")}</span>
              <input
                name="password"
                type="password"
                required
                className="rounded-md border px-3 py-2"
              />
              {registerFieldErrors["password"]?.length ? (
                <div className="text-xs text-red-700">{registerFieldErrors["password"][0]}</div>
              ) : null}
            </label>
            <button
              disabled={busy}
              type="submit"
              className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              {t("auth.register")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
