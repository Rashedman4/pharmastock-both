"use client";

import { useState } from "react";
import NewsFeed from "@/components/app/NewsFeed";
import DailyUpdatesFeed from "@/components/app/DailyUpdatesFeed";

interface LangProps {
  lang: "en" | "ar";
}

type Tab = "news" | "daily-updates";

const labels: Record<Tab, Record<"en" | "ar", string>> = {
  news: { en: "News", ar: "الأخبار" },
  "daily-updates": { en: "Daily Updates", ar: "التحديثات اليومية" },
};

export default function NewsSection({ lang }: LangProps) {
  const [activeTab, setActiveTab] = useState<Tab>("news");

  return (
    <div className="space-y-4">
      <div
        className={`flex gap-2 rounded-xl bg-gray-100 p-1 ${
          lang === "ar" ? "flex-row-reverse" : ""
        }`}
      >
        {(["news", "daily-updates"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-royalBlue text-pureWhite"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            {labels[tab][lang]}
          </button>
        ))}
      </div>

      {activeTab === "news" ? (
        <NewsFeed lang={lang} />
      ) : (
        <DailyUpdatesFeed lang={lang} />
      )}
    </div>
  );
}
