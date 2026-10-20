"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { AnnouncementsPage } from "@/lib/queries/announcements";

const copy = {
  en: {
    empty: "No announcements yet.",
    loading: "Loading…",
    previous: "Previous",
    next: "Next",
    page: (current: number, total: number) => `Page ${current} of ${total}`,
  },
  ar: {
    empty: "لا توجد إعلانات بعد.",
    loading: "جارٍ التحميل…",
    previous: "السابق",
    next: "التالي",
    page: (current: number, total: number) => `صفحة ${current} من ${total}`,
  },
} as const;

interface ApiShape {
  data: AnnouncementsPage["announcements"];
  pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

const fetchPage = async (url: string): Promise<ApiShape> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load announcements");
  return res.json();
};

/**
 * Paginated announcements list.
 *
 * Page 1 is server-rendered and handed in, so the first paint (and anything
 * crawling the page) needs no JavaScript; later pages are fetched.
 */
export default function AnnouncementsFeed({
  lang,
  initialPage,
}: {
  lang: "en" | "ar";
  initialPage: AnnouncementsPage | null;
}) {
  const t = copy[lang];
  const isArabic = lang === "ar";
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR<ApiShape>(
    page === 1 && initialPage ? null : `/api/announcements?page=${page}&limit=15`,
    fetchPage
  );

  const items = page === 1 && initialPage ? initialPage.announcements : data?.data ?? [];
  const totalPages =
    page === 1 && initialPage
      ? initialPage.totalPages
      : data?.pagination.totalPages ?? 1;

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="space-y-4">
      {isLoading && items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {t.loading}
        </p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {t.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/${lang}/announcements/${item.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brightTeal dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brightTeal"
              >
                <span className="inline-block rounded-full border border-royalBlue/20 bg-indigo-50 px-3 py-1 text-xs font-bold tracking-wide text-royalBlue dark:text-slate-100 dark:border-slate-600 dark:bg-slate-800">
                  {item.symbol}
                </span>
                <h2 className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
                  {isArabic ? item.title_ar : item.title_en}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(item.published_date).toLocaleDateString(
                    isArabic ? "ar-EG" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 dark:border-slate-600"
          >
            {t.previous}
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t.page(page, totalPages)}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 dark:border-slate-600"
          >
            {t.next}
          </button>
        </div>
      ) : null}
    </div>
  );
}
