"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Search, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useWatchlist, openAuthModal } from "@/components/app/useWatchlist";

interface Stock {
  symbol: string;
  name_en: string;
  name_ar: string | null;
}

const copy = {
  en: {
    placeholder: "Search by symbol or company name",
    coverage: "We cover US biopharma stocks only.",
    hint: "Start typing to search.",
    noResults: "No stocks found",
    limit: "Your watchlist is full (50 stocks). Remove one to add another.",
    failed: "Could not update your watchlist. Please try again.",
    watch: "Add to watchlist",
    unwatch: "Remove from watchlist",
  },
  ar: {
    placeholder: "ابحث بالرمز أو باسم الشركة",
    coverage: "نغطي أسهم شركات الأدوية والتكنولوجيا الحيوية الأمريكية فقط.",
    hint: "ابدأ بالكتابة للبحث.",
    noResults: "لا توجد أسهم مطابقة",
    limit: "قائمة متابعتك ممتلئة (50 سهماً). أزل سهماً لإضافة آخر.",
    failed: "لم نتمكن من تحديث قائمة متابعتك. حاول مرة أخرى.",
    watch: "أضف إلى قائمة المتابعة",
    unwatch: "أزل من قائمة المتابعة",
  },
} as const;

const fetchStocks = async (url: string): Promise<Stock[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");
  return (await res.json()).data as Stock[];
};

/**
 * Stock search against the covered universe.
 *
 * The note under the input is permanent in both languages: `stocks` is a
 * deliberately narrow list, so "no results" usually means "not covered"
 * rather than "you typed it wrong".
 */
export default function StockSearchPanel({ lang }: { lang: "en" | "ar" }) {
  const t = copy[lang];
  const isArabic = lang === "ar";
  // Seeded from `?q=` so the Navbar's compact search box can hand its term
  // over. Read client-side on purpose: it keeps this page statically rendered.
  const searchParams = useSearchParams();
  const initialTerm = searchParams?.get("q") ?? "";
  const [term, setTerm] = useState(initialTerm);
  const [debounced, setDebounced] = useState(initialTerm.trim());
  const [message, setMessage] = useState<string | null>(null);

  const { watched, isAuthenticated, add, remove } = useWatchlist();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(timer);
  }, [term]);

  const { data, isLoading } = useSWR<Stock[]>(
    debounced ? `/api/stocks/search?q=${encodeURIComponent(debounced)}` : null,
    fetchStocks,
    { keepPreviousData: true }
  );

  async function handleToggle(symbol: string) {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setMessage(null);
    try {
      if (watched.has(symbol)) await remove(symbol);
      else await add(symbol);
    } catch (error) {
      setMessage(error instanceof Error && error.message === "limit" ? t.limit : t.failed);
    }
  }

  const results = data ?? [];

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 ltr:left-3 rtl:right-3" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t.placeholder}
          autoFocus
          className="h-12 bg-white ltr:pl-9 rtl:pr-9 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {term ? (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear"
            className="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ltr:right-3 rtl:left-3 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">{t.coverage}</p>

      {message ? (
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      ) : null}

      {!debounced ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {t.hint}
        </p>
      ) : isLoading && results.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          …
        </p>
      ) : results.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {t.noResults}
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((stock) => {
            const name =
              isArabic && stock.name_ar ? stock.name_ar : stock.name_en;
            const isWatched = watched.has(stock.symbol);
            return (
              <li
                key={stock.symbol}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <Link
                  href={`/${lang}/stocks/${stock.symbol}`}
                  className="min-w-0 flex-1"
                >
                  <span className="block font-bold tracking-wide text-royalBlue dark:text-slate-100">
                    {stock.symbol}
                  </span>
                  {name && name !== stock.symbol ? (
                    <span className="block truncate text-sm text-slate-600 dark:text-slate-300">
                      {name}
                    </span>
                  ) : null}
                </Link>
                <button
                  type="button"
                  onClick={() => handleToggle(stock.symbol)}
                  aria-label={isWatched ? t.unwatch : t.watch}
                  title={isWatched ? t.unwatch : t.watch}
                  className="shrink-0 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Star
                    className={
                      isWatched
                        ? "h-5 w-5 fill-amber-400 text-amber-400"
                        : "h-5 w-5 text-slate-400 dark:text-slate-500"
                    }
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
