"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { useWatchlist } from "@/components/app/useWatchlist";

const copy = {
  en: {
    title: "My watchlist",
    empty: "You are not following any stocks yet.",
    searchCta: "Search stocks",
    note: "Alerts are delivered as notifications in the mobile app.",
    alertsOn: "Alerts on",
    alertsOff: "Alerts off",
    remove: "Remove",
    failed: "Could not update your watchlist. Please try again.",
    loading: "Loading…",
    noPrice: "—",
  },
  ar: {
    title: "قائمة متابعتي",
    empty: "لا تتابع أي أسهم بعد.",
    searchCta: "البحث عن الأسهم",
    note: "تصل التنبيهات على شكل إشعارات في تطبيق الهاتف.",
    alertsOn: "التنبيهات مفعلة",
    alertsOff: "التنبيهات متوقفة",
    remove: "إزالة",
    failed: "لم نتمكن من تحديث قائمة متابعتك. حاول مرة أخرى.",
    loading: "جارٍ التحميل…",
    noPrice: "—",
  },
} as const;

export default function WatchlistPanel({ lang }: { lang: "en" | "ar" }) {
  const t = copy[lang];
  const isArabic = lang === "ar";
  const [message, setMessage] = useState<string | null>(null);
  const { rows, isLoading, remove, setAlerts } = useWatchlist();

  async function run(action: () => Promise<void>) {
    setMessage(null);
    try {
      await action();
    } catch {
      setMessage(t.failed);
    }
  }

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{t.note}</p>

      {message ? (
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      ) : null}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {t.loading}
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">{t.empty}</p>
          <Link
            href={`/${lang}/stocks`}
            className="mt-3 inline-block font-semibold text-brightTeal hover:underline"
          >
            {t.searchCta}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const name = isArabic && row.name_ar ? row.name_ar : row.name_en;
            const price = row.price?.current_price
              ? Number(row.price.current_price)
              : null;
            const change = row.price?.change_percent
              ? Number(row.price.change_percent)
              : null;

            return (
              <li
                key={row.symbol}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <Link href={`/${lang}/stocks/${row.symbol}`} className="min-w-0 flex-1">
                  <span className="block font-bold tracking-wide text-royalBlue dark:text-slate-100">
                    {row.symbol}
                  </span>
                  {name && name !== row.symbol ? (
                    <span className="block truncate text-sm text-slate-600 dark:text-slate-300">
                      {name}
                    </span>
                  ) : null}
                </Link>

                <div className="text-right rtl:text-left">
                  {price !== null ? (
                    <>
                      <span className="block font-semibold text-slate-900 dark:text-slate-100">
                        {price.toFixed(2)}
                      </span>
                      {change !== null ? (
                        <span
                          className={
                            change >= 0
                              ? "block text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                              : "block text-xs font-semibold text-red-600"
                          }
                        >
                          {change >= 0 ? "+" : ""}
                          {change.toFixed(2)}%
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      {t.noPrice}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      run(() => setAlerts(row.symbol, !row.alerts_enabled))
                    }
                    title={row.alerts_enabled ? t.alertsOn : t.alertsOff}
                    aria-label={row.alerts_enabled ? t.alertsOn : t.alertsOff}
                    className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {row.alerts_enabled ? (
                      <Bell className="h-4 w-4 text-brightTeal" />
                    ) : (
                      <BellOff className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => remove(row.symbol))}
                    title={t.remove}
                    aria-label={t.remove}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
