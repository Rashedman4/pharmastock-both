"use client";

import { useEffect, useState } from "react";
import {
  LoadingBlock,
  SectionCard,
  StatusBadge,
  money,
  shortDate,
} from "@/components/program/shared";

interface DetailData {
  investorName: string;
  email: string;
  linkStatus: string;
  referralCodeUsed?: string | null;
  currentCapital: number;
  positions: Array<{
    id: number;
    symbol: string;
    quantity: number;
    entryPrice: number;
    openedAt: string;
    status: string;
  }>;
  closures: Array<{
    id: number;
    symbol: string;
    quantity: number;
    exitPrice: number;
    realizedProfit: number;
    firmShare: number;
    firmPaidAmount: number;
    partnerShare: number;
    partnerUnlockedAmount: number;
    closedAt: string;
  }>;
  summary: {
    realizedProfit: number;
    partnerShare: number;
    firmProfitPaid: number;
    partnerUnlockedAmount: number;
  };
}

export default function PartnerClientDetailPage({
  investorUserId,
  lang = "en",
}: {
  investorUserId: number;
  lang?: "en" | "ar";
}) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const isArabic = lang === "ar";

  const t = isArabic
    ? {
        loading: "جاري تحميل تفاصيل المستثمر...",
        referral: "الإحالة",
        capital: "رأس المال",
        realizedProfit: "الربح المحقق",
        partnerDue: "المستحق الحالي للشريك",
        firmPaid: "ما تم دفعه للشركة",
        unlockedShare: "حصة الشريك المفتوحة",
        openPositionsTitle: "الصفقات المفتوحة",
        openPositionsDescription:
          "فقط الصفقات النشطة تبقى هنا. الصفقات المغلقة تظهر بالأسفل ضمن الإغلاقات.",
        noOpenPositions: "لا توجد صفقات مفتوحة الآن.",
        qty: "الكمية",
        entry: "الدخول",
        closuresTitle: "الإغلاقات",
        closuresDescription: "يتم هنا احتساب الربح ونسبة 5% المنسوبة لك.",
        noClosures: "لا توجد إغلاقات مسجلة حتى الآن.",
        exit: "الخروج",
        profit: "الربح",
        closureShare: "حصة الإغلاق",
      }
    : {
        loading: "Loading investor detail...",
        referral: "Referral",
        capital: "Capital",
        realizedProfit: "Realized profit",
        partnerDue: "Current partner due",
        firmPaid: "Firm paid",
        unlockedShare: "Unlocked partner share",
        openPositionsTitle: "Open positions",
        openPositionsDescription:
          "Only active positions stay here. Closed positions are shown below in closures.",
        noOpenPositions: "No open positions right now.",
        qty: "Qty",
        entry: "Entry",
        closuresTitle: "Closures",
        closuresDescription:
          "Profit and your attributed 5% share are calculated here.",
        noClosures: "No closures recorded yet.",
        exit: "Exit",
        profit: "Profit",
        closureShare: "Closure share",
      };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/partners/clients/${investorUserId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    })();
  }, [investorUserId]);

  if (loading) return <LoadingBlock label={t.loading} />;
  if (!data) return null;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-6 ${isArabic ? "text-right" : ""}`}
    >
      <SectionCard title={data.investorName} description={data.email}>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status={data.linkStatus} lang={lang} />
          {data.referralCodeUsed ? (
            <div
              dir="ltr"
              className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {t.referral}: {data.referralCodeUsed}
            </div>
          ) : null}
          <div className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t.capital}: {money(data.currentCapital, lang)}
          </div>
          <div className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t.realizedProfit}: {money(data.summary.realizedProfit, lang)}
          </div>
          <div className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t.partnerDue}: {money(data.summary.partnerShare, lang)}
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {t.firmPaid}: {money(data.summary.firmProfitPaid, lang)}
          </div>
          <div className="rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            {t.unlockedShare}: {money(data.summary.partnerUnlockedAmount, lang)}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t.openPositionsTitle}
        description={t.openPositionsDescription}
      >
        <div className="space-y-3">
          {data.positions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.noOpenPositions}</p>
          ) : (
            data.positions.map((position) => (
              <div
                key={position.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {position.symbol}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t.qty} {position.quantity} • {t.entry}{" "}
                      {money(position.entryPrice, lang)} •{" "}
                      {shortDate(position.openedAt, lang)}
                    </p>
                  </div>
                  <StatusBadge status={position.status} lang={lang} />
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title={t.closuresTitle} description={t.closuresDescription}>
        <div className="space-y-3">
          {data.closures.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.noClosures}</p>
          ) : (
            data.closures.map((closure) => (
              <div
                key={closure.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {closure.symbol}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t.qty} {closure.quantity} • {t.exit}{" "}
                      {money(closure.exitPrice, lang)} •{" "}
                      {shortDate(closure.closedAt, lang)}
                    </p>
                  </div>
                  <div
                    className={`text-sm ${isArabic ? "text-right" : "text-left sm:text-right"}`}
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {t.profit} {money(closure.realizedProfit, lang)}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t.closureShare} {money(closure.partnerShare, lang)}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t.firmPaid} {money(closure.firmPaidAmount, lang)}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t.unlockedShare}{" "}
                      {money(closure.partnerUnlockedAmount, lang)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
