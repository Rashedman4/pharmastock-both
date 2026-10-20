"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { AnnouncementArticle as Announcement } from "@/lib/queries/announcements";

const copy = {
  en: {
    translatedNotice: "Translated from English",
    viewOriginal: "View original (English)",
    viewTranslation: "View the Arabic translation",
    source: "Source",
    announced: "Announced",
  },
  ar: {
    translatedNotice: "مترجم من الإنجليزية",
    viewOriginal: "عرض النص الأصلي",
    viewTranslation: "عرض الترجمة العربية",
    source: "المصدر",
    announced: "تاريخ الإعلان",
  },
} as const;

/**
 * One announcement.
 *
 * Arabic readers get the translation with a note saying so and a toggle to the
 * verbatim English original; English readers get the original and no toggle,
 * because there is nothing to switch to.
 */
export default function AnnouncementArticle({
  lang,
  announcement,
}: {
  lang: "en" | "ar";
  announcement: Announcement;
}) {
  const t = copy[lang];
  const isArabic = lang === "ar";
  const [showOriginal, setShowOriginal] = useState(false);

  const showingArabic = isArabic && !showOriginal;
  const title = showingArabic ? announcement.title_ar : announcement.title_en;
  const content = showingArabic
    ? announcement.content_ar
    : announcement.content_en;

  return (
    <article dir={isArabic ? "rtl" : "ltr"} className="space-y-4">
      <Link
        href={`/${lang}/stocks/${announcement.symbol}`}
        className="inline-block rounded-full border border-royalBlue/20 bg-indigo-50 px-3 py-1 text-xs font-bold tracking-wide text-royalBlue dark:text-slate-100 hover:border-brightTeal dark:border-slate-600 dark:bg-slate-800"
      >
        {announcement.symbol}
      </Link>

      <h1 className="text-3xl font-bold text-royalBlue dark:text-slate-100">
        {title}
      </h1>

      {isArabic ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-800">
          {!showOriginal ? (
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {t.translatedNotice}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="text-xs font-bold text-brightTeal hover:underline"
          >
            {showOriginal ? t.viewTranslation : t.viewOriginal}
          </button>
        </div>
      ) : null}

      <MarkdownContent lang={showingArabic ? "ar" : "en"}>
        {content}
      </MarkdownContent>

      {announcement.source_url ? (
        <a
          href={announcement.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-brightTeal hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {t.source}
        </a>
      ) : null}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t.announced}:{" "}
        {new Date(
          announcement.announced_at ?? announcement.published_date
        ).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </article>
  );
}
