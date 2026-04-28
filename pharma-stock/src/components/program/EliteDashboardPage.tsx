"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  HeroPanel,
  LoadingBlock,
  SectionCard,
  StatCard,
  money,
} from "@/components/program/shared";

interface DashboardData {
  memberId: number;
  currentCapitalAmount: number;
  freeCapitalAmount: number;
  moneyInMarket: number;
  totalEquity: number;
  overallProfit: number;
  firmProfit: number;
  investorProfit: number;
  feeNotice: string;
  pendingPlans: number;
  executedPlans: number;
  openPositions: number;
  closedPositions: number;
}

const translations = {
  en: {
    loading: "Loading investor dashboard...",
    emptyTitle: "Elite access not ready",
    emptyDescription: "You need an approved Elite membership first.",
    emptyCta: "Open Elite page",
    heroBadge: "Investor dashboard",
    heroTitle: "Plans, portfolio, and current capital in one place.",
    feeNotice: "15% of realized profit is retained by the firm.",
    viewPlans: "Review plans",
    viewPortfolio: "Track portfolio",
    freeCapital: "Free capital",
    moneyInMarket: "Money in market",
    totalEquity: "Total equity",
    investorProfit: "Investor profit",
    pendingPlans: "Pending plans",
    executedPlans: "Executed plans",
    openPositions: "Open positions",
    firmProfit: "Firm profit",
    nextTitle: "What to do next",
    nextSteps: [
      "Update your current capital whenever it changes.",
      "Open your plans, accept or reject them, and submit the execution you actually entered.",
      "Open your portfolio to see current prices, unrealized profit, and request a close when needed.",
      "Admin initiated close requests will appear in the portfolio waiting for your approval.",
    ],
    fallbackLoadError: "Failed to load dashboard.",
  },
  ar: {
    loading: "جاري تحميل لوحة المستثمر...",
    emptyTitle: "وصول النخبة غير جاهز",
    emptyDescription: "أنت بحاجة أولاً إلى عضوية نخبة معتمدة.",
    emptyCta: "افتح صفحة النخبة",
    heroBadge: "لوحة المستثمر",
    heroTitle: "تابع خططك ومحفظتك ورأس مالك الحالي من مكان واحد.",
    feeNotice: "تحتفظ الشركة بنسبة 15٪ من الأرباح المحققة.",
    viewPlans: "مراجعة الخطط",
    viewPortfolio: "متابعة المحفظة",
    freeCapital: "رأس المال الحر",
    moneyInMarket: "الأموال داخل السوق",
    totalEquity: "إجمالي حقوق الملكية",
    investorProfit: "ربح المستثمر",
    pendingPlans: "الخطط المعلقة",
    executedPlans: "الخطط المنفذة",
    openPositions: "المراكز المفتوحة",
    firmProfit: "ربح الشركة",
    nextTitle: "ماذا تفعل الآن",
    nextSteps: [
      "حدّث رأس المال الحالي كلما تغيّر.",
      "افتح الخطط، واقبلها أو ارفضها، ثم أرسل التنفيذ الفعلي الذي دخلت به.",
      "افتح المحفظة لمتابعة الأسعار الحالية والربح غير المحقق وطلب الإغلاق عند الحاجة.",
      "طلبات الإغلاق التي يبدأها المشرف ستظهر في المحفظة بانتظار موافقتك.",
    ],
    fallbackLoadError: "فشل في تحميل اللوحة.",
  },
} as const;

export default function EliteDashboardPage({
  lang = "en",
}: {
  lang?: "en" | "ar";
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];
  const isArabic = lang === "ar";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/elite/dashboard", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || t.fallbackLoadError);
        setData(json);
      } catch (err: any) {
        setError(err.message || t.fallbackLoadError);
      } finally {
        setLoading(false);
      }
    })();
  }, [t.fallbackLoadError]);

  if (loading) return <LoadingBlock label={t.loading} />;

  if (error || !data) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={isArabic ? "text-right" : ""}
      >
        <EmptyState
          title={t.emptyTitle}
          description={error || t.emptyDescription}
          ctaHref={`/${lang}/elite-group`}
          ctaLabel={t.emptyCta}
        />
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-8 ${isArabic ? "text-right" : ""}`}
    >
      <HeroPanel
        lang={lang}
        badge={t.heroBadge}
        title={t.heroTitle}
        description={isArabic ? t.feeNotice : data.feeNotice}
        actions={
          isArabic ? (
            <>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-w-[170px] border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href={`/${lang}/elite-group/portfolio`}>
                  {t.viewPortfolio}
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="min-w-[170px] border border-white/40 bg-white text-slate-950 shadow-lg shadow-black/20 hover:bg-slate-100"
              >
                <Link href={`/${lang}/elite-group/plan`}>{t.viewPlans}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="min-w-[170px] border border-white/40 bg-white text-slate-950 shadow-lg shadow-black/20 hover:bg-slate-100"
              >
                <Link href={`/${lang}/elite-group/plan`}>{t.viewPlans}</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-w-[170px] border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href={`/${lang}/elite-group/portfolio`}>
                  {t.viewPortfolio}
                </Link>
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.freeCapital}
          value={money(data.freeCapitalAmount, lang)}
        />
        <StatCard
          label={t.moneyInMarket}
          value={money(data.moneyInMarket, lang)}
        />
        <StatCard label={t.totalEquity} value={money(data.totalEquity, lang)} />
        <StatCard
          label={t.investorProfit}
          value={money(data.investorProfit, lang)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label={t.pendingPlans} value={String(data.pendingPlans)} />
        <StatCard label={t.executedPlans} value={String(data.executedPlans)} />
        <StatCard label={t.openPositions} value={String(data.openPositions)} />
        <StatCard label={t.firmProfit} value={money(data.firmProfit, lang)} />
      </div>

      <SectionCard title={t.nextTitle}>
        <ul className="space-y-3 text-sm text-slate-600">
          {t.nextSteps.map((step) => (
            <li key={step}>• {step}</li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
