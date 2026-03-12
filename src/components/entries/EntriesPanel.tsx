"use client";

import { useEffect, useState } from "react";
import { ApiFetchError, apiFetch, issuesToFieldErrors } from "@/lib/apiFetch";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Entry = {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
};

export function EntriesPanel() {
  const { t } = useI18n();
  const [type, setType] = useState("fixed_cost_adjustment");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function refresh() {
    const json = await apiFetch<{ entries: Entry[] }>("/api/entries/list?limit=50", {
      cache: "no-store",
    });
    setEntries(json.entries ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setFieldErrors({});
          try {
            await apiFetch<{ ok: true }>("/api/entries/create", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ type, amount, description }),
            });
            setDescription("");
            setAmount(0);
            await refresh();
          } catch (err) {
            if (err instanceof ApiFetchError) {
              setError(err.message);
              setFieldErrors(issuesToFieldErrors(err.details));
            } else {
              setError(t("common.requestFailed"));
            }
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="text-sm font-semibold">{t("entries.createEntry")}</div>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          {t("entries.type")}
          <input
            className="rounded-md border px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          {fieldErrors["type"]?.length ? (
            <div className="text-xs text-red-700">{fieldErrors["type"][0]}</div>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("entries.amount")}
          <input
            className="rounded-md border px-3 py-2"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          {fieldErrors["amount"]?.length ? (
            <div className="text-xs text-red-700">{fieldErrors["amount"][0]}</div>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("entries.description")}
          <textarea
            className="min-h-24 rounded-md border px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {fieldErrors["description"]?.length ? (
            <div className="text-xs text-red-700">{fieldErrors["description"][0]}</div>
          ) : null}
        </label>
        <button
          disabled={busy}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          type="submit"
        >
          {t("common.create")}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{t("entries.recentEntries")}</div>
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50"
            onClick={refresh}
          >
            {t("common.refresh")}
          </button>
        </div>
        <div className="divide-y rounded-lg border">
          {entries.length === 0 ? (
            <div className="p-4 text-sm text-zinc-600">{t("entries.noEntriesYet")}</div>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{e.type}</div>
                  <div className="mt-1 text-sm text-zinc-600">{e.description || "—"}</div>
                  <div className="mt-1 text-xs text-zinc-500">{e.createdAt}</div>
                </div>
                <div className="shrink-0 text-sm font-semibold">{money(e.amount)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function money(v: number) {
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
