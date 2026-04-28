"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CopyButton,
  EmptyState,
  HeroPanel,
  LoadingBlock,
  SectionCard,
  StatCard,
  StatusBadge,
  money,
  shortDate,
} from "@/components/program/shared";

interface DashboardData {
  status: string;
  partner?: { displayName?: string; referralCode?: string | null };
  referralCode?: string | null;
  invitationLink?: string | null;
  clientsCount?: number;
  totalCapital?: number;
  totalRealizedProfit?: number;
  totalPartnerShare?: number;
  partnerUnlockedAmount?: number;
  partnerAvailableToRequestAmount?: number;
  partnerRequestedLockedAmount?: number;
  partnerPaidOutAmount?: number;
  iban?: string | null;
  payoutRequests?: Array<{
    id: number;
    requestedAmount: number;
    ibanSnapshot: string;
    status: string;
    createdAt: string;
    paidAt?: string | null;
  }>;
}

export default function PartnerDashboardPage({
  lang = "en",
}: {
  lang?: "en" | "ar";
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [iban, setIban] = useState("");
  const [note, setNote] = useState("");
  const base = `/${lang}`;
  const isArabic = lang === "ar";

  const t = isArabic
    ? {
        loading: "جاري تحميل لوحة الشريك...",
        noAccountTitle: "لا يوجد حساب شريك حتى الآن",
        noAccountDescription: "لن تصبح شريكًا قبل إرسال الطلب.",
        applyNow: "قدّم الآن",
        badge: "لوحة الشريك",
        title:
          "رمز الإحالة الخاص بك، المستثمرون المرتبطون بك، والنتائج المحققة.",
        description:
          "هذه الصفحة أصبحت مركزة على الأمور الوحيدة التي يحتاج الشريك لرؤيتها فعلاً.",
        status: "الحالة",
        referralCode: "رمز الإحالة",
        notAvailableYet: "غير متاح حتى الآن",
        approvalPendingTitle: "بانتظار الموافقة",
        approvalPendingDescription:
          "تبقى اللوحة محدودة حتى توافق الإدارة على حسابك.",
        approvalPendingBody:
          "بعد الموافقة ستحصل على رمز إحالة وسيتفعّل رابط الدعوة الخاص بك.",
        editApplication: "تعديل الطلب",
        linkedInvestors: "المستثمرون المرتبطون",
        trackedCapital: "رأس المال المتتبع",
        realizedProfit: "الربح المحقق",
        currentDue: "المستحق الحالي 5%",
        currentDueHint:
          "هذا يتبع صافي الفترة المغلقة الحالية التي لم تتم تسويتها بعد.",
        unlockedShare: "الحصة المفتوحة",
        unlockedShareHint: "تُفتح فقط بعد أن يدفع المستثمر حصة الشركة.",
        availableToRequest: "المتاح للطلب",
        requested: "تم طلبه",
        paidOut: "تم دفعه",
        referralToolsTitle: "أدوات الإحالة",
        referralToolsDescription:
          "شارك رابط دعوة برنامج النخبة هذا مع المستثمرين.",
        invitationLink: "رابط الدعوة",
        notAvailable: "غير متاح",
        copyCode: "نسخ الرمز",
        copyLink: "نسخ رابط الدعوة",
        copied: "تم النسخ",
        openClients: "فتح العملاء",
        payoutTitle: "طلب دفعة الشريك",
        payoutDescription:
          "عندما يدفع المستثمر حصة الشركة، تصبح حصة الشريك المرتبطة بها متاحة للطلب.",
        ibanPlaceholder: "IBAN",
        notePlaceholder: "ملاحظة اختيارية للإدارة",
        saving: "جاري الحفظ...",
        requestAmount: "طلب",
        dueSummaryPrefix: "المستحق الحالي للشريك:",
        unlockedPrefix: "المبلغ المفتوح لأن المستثمرين دفعوا بالفعل:",
        availablePrefix: "المتاح للطلب حاليًا:",
        noPayouts: "لا توجد طلبات دفعات حتى الآن.",
        paidLabel: "تم الدفع",
        requestedLabel: "تم الطلب",
        failedRequest: "فشل في طلب دفعة الشريك.",
        requestSaved: "تم حفظ طلب دفعة الشريك.",
      }
    : {
        loading: "Loading partner dashboard...",
        noAccountTitle: "No partner account yet",
        noAccountDescription:
          "You are not a partner until you submit the application.",
        applyNow: "Apply now",
        badge: "Partner dashboard",
        title: "Your referral code, linked investors, and realized results.",
        description:
          "This page is now focused on the only things a partner actually needs to see.",
        status: "Status",
        referralCode: "Referral code",
        notAvailableYet: "Not available yet",
        approvalPendingTitle: "Approval pending",
        approvalPendingDescription:
          "The dashboard stays limited until admin approves your account.",
        approvalPendingBody:
          "Once approved, you will receive a referral code and your invitation link will become active.",
        editApplication: "Edit application",
        linkedInvestors: "Linked investors",
        trackedCapital: "Tracked capital",
        realizedProfit: "Realized profit",
        currentDue: "Current 5% due",
        currentDueHint:
          "This follows the current net closed period that has not been settled yet.",
        unlockedShare: "Unlocked share",
        unlockedShareHint:
          "Unlocked only after the investor pays the firm's share.",
        availableToRequest: "Available to request",
        requested: "Requested",
        paidOut: "Paid out",
        referralToolsTitle: "Referral tools",
        referralToolsDescription:
          "Share this Elite Program invitation link with investors.",
        invitationLink: "Invitation link",
        notAvailable: "Not available",
        copyCode: "Copy code",
        copyLink: "Copy invitation link",
        copied: "Copied",
        openClients: "Open clients",
        payoutTitle: "Request partner payout",
        payoutDescription:
          "Once an investor pays the firm's share, the related partner share becomes unlocked and requestable.",
        ibanPlaceholder: "IBAN",
        notePlaceholder: "Optional note for admin",
        saving: "Saving...",
        requestAmount: "Request",
        dueSummaryPrefix: "Current partner due:",
        unlockedPrefix: "Unlocked because investors already paid:",
        availablePrefix: "Still available to request:",
        noPayouts: "No payout requests yet.",
        paidLabel: "Paid",
        requestedLabel: "Requested",
        failedRequest: "Failed to request partner payout.",
        requestSaved: "Partner payout request saved.",
      };

  async function loadData() {
    try {
      const res = await fetch("/api/partners/dashboard", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setIban(json?.iban || "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function requestPartnerPayout() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await fetch("/api/partners/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iban, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.failedRequest);
      setInfo(json?.message || t.requestSaved);
      setNote("");
      await loadData();
    } catch (err: any) {
      setError(err.message || t.failedRequest);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingBlock label={t.loading} />;
  if (!data || data.status === "NONE") {
    return (
      <EmptyState
        title={t.noAccountTitle}
        description={t.noAccountDescription}
        ctaHref={`${base}/partners/apply`}
        ctaLabel={t.applyNow}
      />
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-8 ${isArabic ? "text-right" : ""}`}
    >
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {info}
        </div>
      ) : null}
      <HeroPanel
        lang={lang}
        badge={t.badge}
        title={t.title}
        description={t.description}
      >
        <div className="space-y-3 text-sm text-slate-200">
          <div>
            <p className="text-slate-300">{t.status}</p>
            <div className="mt-2">
              <StatusBadge status={data.status} lang={lang} />
            </div>
          </div>
          <div>
            <p className="text-slate-300">{t.referralCode}</p>
            <p
              dir="ltr"
              className="mt-1 text-left text-xl font-semibold text-white"
            >
              {data.referralCode || t.notAvailableYet}
            </p>
          </div>
        </div>
      </HeroPanel>

      {data.status !== "APPROVED" ? (
        <SectionCard
          title={t.approvalPendingTitle}
          description={t.approvalPendingDescription}
        >
          <p className="text-sm text-slate-600">{t.approvalPendingBody}</p>
          <div
            className={`mt-4 ${isArabic ? "flex justify-start md:justify-end" : ""}`}
          >
            <Button asChild>
              <Link href={`${base}/partners/apply`}>{t.editApplication}</Link>
            </Button>
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label={t.linkedInvestors}
              value={String(data.clientsCount || 0)}
            />
            <StatCard
              label={t.trackedCapital}
              value={money(data.totalCapital || 0, lang)}
            />
            <StatCard
              label={t.realizedProfit}
              value={money(data.totalRealizedProfit || 0, lang)}
            />
            <StatCard
              label={t.currentDue}
              value={money(data.totalPartnerShare || 0, lang)}
              hint={t.currentDueHint}
            />
            <StatCard
              label={t.unlockedShare}
              value={money(data.partnerUnlockedAmount || 0, lang)}
              hint={t.unlockedShareHint}
            />
            <StatCard
              label={t.availableToRequest}
              value={money(data.partnerAvailableToRequestAmount || 0, lang)}
            />
            <StatCard
              label={t.requested}
              value={money(data.partnerRequestedLockedAmount || 0, lang)}
            />
            <StatCard
              label={t.paidOut}
              value={money(data.partnerPaidOutAmount || 0, lang)}
            />
          </div>

          <SectionCard
            title={t.referralToolsTitle}
            description={t.referralToolsDescription}
          >
            <div className="grid gap-4 lg:grid-cols-[1fr,auto]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {t.invitationLink}
                </p>
                <p
                  dir="ltr"
                  className="mt-2 break-all text-left text-sm font-medium text-slate-900"
                >
                  {data.invitationLink || t.notAvailable}
                </p>
              </div>
              <div
                className={`flex flex-wrap items-center gap-2 ${isArabic ? "justify-start lg:justify-end" : ""}`}
              >
                <CopyButton
                  value={data.referralCode}
                  label={t.copyCode}
                  copiedLabel={t.copied}
                />
                <CopyButton
                  value={data.invitationLink}
                  label={t.copyLink}
                  copiedLabel={t.copied}
                />
                <Button asChild variant="outline">
                  <Link href={`${base}/partners/clients`}>{t.openClients}</Link>
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t.payoutTitle} description={t.payoutDescription}>
            <div className="grid gap-4 lg:grid-cols-[1fr,1fr,auto]">
              <Input
                dir="ltr"
                className="text-left"
                placeholder={t.ibanPlaceholder}
                value={iban}
                onChange={(e) => setIban(e.target.value)}
              />
              <Textarea
                dir={isArabic ? "rtl" : "ltr"}
                className={isArabic ? "text-right" : ""}
                placeholder={t.notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                type="button"
                disabled={
                  busy || (data.partnerAvailableToRequestAmount || 0) <= 0
                }
                onClick={requestPartnerPayout}
              >
                {busy
                  ? t.saving
                  : `${t.requestAmount} ${money(data.partnerAvailableToRequestAmount || 0, lang)}`}
              </Button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {t.dueSummaryPrefix} {money(data.totalPartnerShare || 0, lang)} •{" "}
              {t.unlockedPrefix} {money(data.partnerUnlockedAmount || 0, lang)}{" "}
              • {t.availablePrefix}{" "}
              {money(data.partnerAvailableToRequestAmount || 0, lang)}
            </div>
            <div className="mt-4 space-y-3">
              {(data.payoutRequests || []).length === 0 ? (
                <p className="text-sm text-slate-500">{t.noPayouts}</p>
              ) : (
                data.payoutRequests?.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {money(request.requestedAmount, lang)}
                        </p>
                        <p
                          dir="ltr"
                          className="text-left text-sm text-slate-500"
                        >
                          IBAN {request.ibanSnapshot} •{" "}
                          {request.paidAt
                            ? `${t.paidLabel} ${shortDate(request.paidAt, lang)}`
                            : `${t.requestedLabel} ${shortDate(request.createdAt, lang)}`}
                        </p>
                      </div>
                      <StatusBadge status={request.status} lang={lang} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
