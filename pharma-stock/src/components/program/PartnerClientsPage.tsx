"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  LoadingBlock,
  SectionCard,
  StatusBadge,
  money,
} from "@/components/program/shared";

interface ClientRow {
  investorUserId: number;
  investorName: string;
  email: string;
  linkStatus: string;
  memberStatus?: string | null;
  currentCapital: number;
  realizedProfit: number;
  partnerShare: number;
  firmProfitPaid: number;
  partnerUnlockedAmount: number;
  openPositions: number;
}

export default function PartnerClientsPage({
  lang = "en",
}: {
  lang?: "en" | "ar";
}) {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isArabic = lang === "ar";

  const t = isArabic
    ? {
        loading: "جاري تحميل المستثمرين المرتبطين...",
        emptyTitle: "لا يوجد مستثمرون مرتبطون حتى الآن",
        emptyDescription:
          "هذا طبيعي إذا لم ينضم أحد إلى برنامج النخبة من خلال رابط الإحالة الخاص بك بعد.",
        backToDashboard: "العودة إلى لوحة التحكم",
        title: "المستثمرون المرتبطون",
        description: "كل مستثمر تم ربطه برمز الإحالة الخاص بك سيظهر هنا.",
        capital: "رأس المال",
        realizedProfit: "الربح المحقق",
        partnerDue: "المستحق الحالي للشريك",
        firmPaid: "ما تم دفعه للشركة",
        unlockedShare: "الحصة المفتوحة",
        openPositions: "الصفقات المفتوحة",
        viewInvestor: "عرض المستثمر",
      }
    : {
        loading: "Loading linked investors...",
        emptyTitle: "No linked investors yet",
        emptyDescription:
          "This is normal if nobody has joined the Elite Program through your referral link yet.",
        backToDashboard: "Back to dashboard",
        title: "Linked investors",
        description:
          "Every investor mapped to your referral code appears here.",
        capital: "Capital",
        realizedProfit: "Realized profit",
        partnerDue: "Current partner due",
        firmPaid: "Firm paid",
        unlockedShare: "Unlocked share",
        openPositions: "Open positions",
        viewInvestor: "View investor",
      };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/partners/clients", { cache: "no-store" });
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingBlock label={t.loading} />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title={t.emptyTitle}
        description={t.emptyDescription}
        ctaHref={`/${lang}/partners/dashboard`}
        ctaLabel={t.backToDashboard}
      />
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={isArabic ? "text-right" : ""}
    >
      <SectionCard title={t.title} description={t.description}>
        <div className="space-y-4">
          {rows.map((row) => (
            <div
              key={row.investorUserId}
              className="rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {row.investorName}
                    </h3>
                    <StatusBadge status={row.linkStatus} lang={lang} />
                    {row.memberStatus ? (
                      <StatusBadge status={row.memberStatus} lang={lang} />
                    ) : null}
                  </div>
                  <p dir="ltr" className="text-left text-sm text-slate-500">
                    {row.email}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span>
                      {t.capital}: {money(row.currentCapital, lang)}
                    </span>
                    <span>
                      {t.realizedProfit}: {money(row.realizedProfit, lang)}
                    </span>
                    <span>
                      {t.partnerDue}: {money(row.partnerShare, lang)}
                    </span>
                    <span>
                      {t.firmPaid}: {money(row.firmProfitPaid, lang)}
                    </span>
                    <span>
                      {t.unlockedShare}:{" "}
                      {money(row.partnerUnlockedAmount, lang)}
                    </span>
                    <span>
                      {t.openPositions}: {row.openPositions}
                    </span>
                  </div>
                </div>
                <div
                  className={`flex gap-2 ${isArabic ? "justify-start lg:justify-end" : ""}`}
                >
                  <Button asChild variant="outline">
                    <Link
                      href={`/${lang}/partners/clients/${row.investorUserId}`}
                    >
                      {t.viewInvestor}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
