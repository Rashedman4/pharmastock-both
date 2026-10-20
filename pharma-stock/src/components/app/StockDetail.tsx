"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Bell, BellOff, Star } from "lucide-react";
import { useWatchlist, openAuthModal } from "@/components/app/useWatchlist";

interface CachedPrice {
  current_price: string | null;
  change_percent: string | null;
  currency: string | null;
  market_status: string | null;
}

interface Summary {
  id: number;
  title_en?: string;
  title_ar?: string;
  subtitle_en?: string | null;
  subtitle_ar?: string | null;
  published_date?: string;
  created_at?: string;
}

export interface StockDetailData {
  symbol: string;
  name_en: string;
  name_ar: string | null;
  price: CachedPrice | null;
  is_watched: boolean;
  alerts_enabled: boolean;
  announcements: Summary[];
  daily_updates: Summary[];
  breakthroughs: Summary[];
  news: Summary[];
}

const copy = {
  en: {
    watch: "Watch",
    watching: "Watching",
    alertsOn: "Alerts on",
    alertsOff: "Alerts off",
    alertsHint:
      "Alerts are delivered as notifications in the mobile app.",
    noPrice: "No price yet",
    announcements: "Announcements",
    dailyUpdates: "Daily updates",
    breakthroughs: "FDA designations",
    news: "News",
    empty: "Nothing here yet",
    limit: "Your watchlist is full (50 stocks). Remove one to add another.",
    failed: "Could not update your watchlist. Please try again.",
  },
  ar: {
    watch: "متابعة",
    watching: "تتابعه",
    alertsOn: "التنبيهات مفعلة",
    alertsOff: "التنبيهات متوقفة",
    alertsHint: "تصل التنبيهات على شكل إشعارات في تطبيق الهاتف.",
    noPrice: "لا يوجد سعر بعد",
    announcements: "إعلانات الشركات",
    dailyUpdates: "التحديثات اليومية",
    breakthroughs: "تصنيفات هيئة الغذاء والدواء",
    news: "الأخبار",
    empty: "لا يوجد شيء هنا بعد",
    limit: "قائمة متابعتك ممتلئة (50 سهماً). أزل سهماً لإضافة آخر.",
    failed: "لم نتمكن من تحديث قائمة متابعتك. حاول مرة أخرى.",
  },
} as const;

const fetchStock = async (url: string): Promise<StockDetailData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load stock");
  return res.json();
};

function formatDate(value: string | undefined, lang: "en" | "ar") {
  if (!value) return "";
  return new Date(value).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * The stock page body.
 *
 * `initialData` is server-rendered (so crawlers and the first paint get the
 * content); the client then refetches the same endpoint, which additionally
 * carries the signed-in user's watch state.
 */
export default function StockDetail({
  lang,
  symbol,
  initialData,
}: {
  lang: "en" | "ar";
  symbol: string;
  initialData: StockDetailData;
}) {
  const t = copy[lang];
  const isArabic = lang === "ar";
  const [message, setMessage] = useState<string | null>(null);

  const { data, mutate } = useSWR<StockDetailData>(
    `/api/stocks/${encodeURIComponent(symbol)}`,
    fetchStock,
    { fallbackData: initialData }
  );
  const stock = data ?? initialData;

  const { isAuthenticated, add, remove, setAlerts } = useWatchlist();

  async function handleWatch() {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setMessage(null);
    try {
      if (stock.is_watched) await remove(stock.symbol);
      else await add(stock.symbol);
      await mutate();
    } catch (error) {
      setMessage(error instanceof Error && error.message === "limit" ? t.limit : t.failed);
    }
  }

  async function handleAlerts() {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setMessage(null);
    try {
      await setAlerts(stock.symbol, !stock.alerts_enabled);
      await mutate();
    } catch {
      setMessage(t.failed);
    }
  }

  const name = isArabic && stock.name_ar ? stock.name_ar : stock.name_en;
  const price = stock.price?.current_price
    ? Number(stock.price.current_price)
    : null;
  const changePercent = stock.price?.change_percent
    ? Number(stock.price.change_percent)
    : null;

  const sections: { title: string; items: Summary[]; href: (id: number) => string }[] = [
    {
      title: t.announcements,
      items: stock.announcements,
      href: (id) => `/${lang}/announcements/${id}`,
    },
    {
      title: t.dailyUpdates,
      items: stock.daily_updates,
      href: () => `/${lang}/news`,
    },
    {
      title: t.breakthroughs,
      items: stock.breakthroughs,
      href: () => `/${lang}/fda-designation`,
    },
    { title: t.news, items: stock.news, href: () => `/${lang}/news` },
  ];

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-royalBlue dark:text-slate-100">
              {stock.symbol}
            </h1>
            {name && name !== stock.symbol ? (
              <p className="mt-1 text-slate-600 dark:text-slate-300">{name}</p>
            ) : null}
          </div>
          <div className="text-right rtl:text-left">
            {price !== null ? (
              <>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {price.toFixed(2)}
                </p>
                {changePercent !== null ? (
                  <p
                    className={
                      changePercent >= 0
                        ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                        : "text-sm font-semibold text-red-600"
                    }
                  >
                    {changePercent >= 0 ? "+" : ""}
                    {changePercent.toFixed(2)}%
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.noPrice}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleWatch}
            className={
              stock.is_watched
                ? "inline-flex items-center gap-2 rounded-full bg-royalBlue px-4 py-2 text-sm font-semibold text-pureWhite"
                : "inline-flex items-center gap-2 rounded-full border border-royalBlue px-4 py-2 text-sm font-semibold text-royalBlue dark:border-slate-500 dark:text-slate-200"
            }
          >
            <Star className={stock.is_watched ? "h-4 w-4 fill-current" : "h-4 w-4"} />
            {stock.is_watched ? t.watching : t.watch}
          </button>

          {stock.is_watched ? (
            <button
              type="button"
              onClick={handleAlerts}
              className={
                stock.alerts_enabled
                  ? "inline-flex items-center gap-2 rounded-full bg-brightTeal px-4 py-2 text-sm font-semibold text-pureWhite"
                  : "inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300"
              }
            >
              {stock.alerts_enabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              {stock.alerts_enabled ? t.alertsOn : t.alertsOff}
            </button>
          ) : null}
        </div>

        {stock.is_watched ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t.alertsHint}
          </p>
        ) : null}

        {message ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{message}</p>
        ) : null}
      </div>

      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 text-xl font-bold text-royalBlue dark:text-slate-100">
            {section.title}
          </h2>
          {section.items.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.empty}</p>
          ) : (
            <ul className="space-y-2">
              {section.items.map((item) => {
                const title =
                  (isArabic
                    ? item.title_ar ?? item.subtitle_ar
                    : item.title_en ?? item.subtitle_en) ||
                  item.title_en ||
                  stock.symbol;
                return (
                  <li key={`${section.title}-${item.id}`}>
                    <Link
                      href={section.href(item.id)}
                      className="block rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-brightTeal dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brightTeal"
                    >
                      <span className="block font-medium text-slate-900 dark:text-slate-100">
                        {title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(item.published_date ?? item.created_at, lang)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
