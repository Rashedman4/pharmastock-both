"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LoadingBlock,
  SectionCard,
  StatusBadge,
} from "@/components/program/shared";
import { EVIDENCE_IMAGE_ACCEPT, uploadEvidence } from "@/lib/evidence-upload";

interface PortfolioData {
  currentCapitalAmount: number;
  openPositions: Array<{
    id: number;
    symbol: string;
    quantityOpen: number;
    entryPrice: number;
    currentPrice: number;
    investedAmount: number;
    marketValue: number;
    unrealizedProfit: number;
    openedAt: string;
    status: string;
    targetPrice1?: number | null;
    targetPrice2?: number | null;
    stopLossPrice?: number | null;
  }>;
  closeRequests: Array<{
    id: number;
    positionId: number;
    initiatedByRole: string;
    requestedQuantity: number;
    requestedExitPrice?: number | null;
    requestNote?: string | null;
    evidenceUrl?: string | null;
    evidenceName?: string | null;
    status: string;
    responseNote?: string | null;
    createdAt: string;
  }>;
  closures: Array<{
    id: number;
    symbol: string;
    closedQuantity: number;
    exitPrice: number;
    realizedProfitAmount: number;
    firmShareAmount: number;
    firmPaidAmount: number;
    firmOutstandingAmount: number;
    partnerShareAmount: number;
    partnerUnlockedAmount: number;
    evidenceUrl?: string | null;
    evidenceName?: string | null;
    closedAt: string;
  }>;
  firmPayments: Array<{
    id: number;
    amountRequested: number;
    amountPaid: number;
    currency: string;
    status: string;
    paymentMethod?: string | null;
    manualReference?: string | null;
    transferReference?: string | null;
    proofUrl?: string | null;
    proofName?: string | null;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    reviewNote?: string | null;
    bankAccountName?: string | null;
    bankName?: string | null;
    iban?: string | null;
    swiftCode?: string | null;
    paidAt?: string | null;
    createdAt: string;
  }>;
  summary: {
    freeCapitalAmount: number;
    moneyInMarket: number;
    investedAtCost: number;
    totalEquity: number;
    openMarketValue: number;
    openUnrealizedProfit: number;
    realizedProfit: number;
    overallProfit: number;
    firmProfit: number;
    firmProfitPaid: number;
    firmProfitOutstanding: number;
    partnerProfit: number;
    partnerShareUnlocked: number;
    realizedInvestorProfit: number;
    investorProfit: number;
  };
}

type Lang = "en" | "ar";

const translations = {
  en: {
    loading: "Loading portfolio...",
    errorLoad: "Failed to load portfolio.",
    stripeCompleted:
      "Stripe payment completed. The paid firm profit will appear here after the webhook confirms it.",
    stripeCancelled: "Firm profit payment was cancelled.",
    errorCreateCloseRequest: "Failed to create close request.",
    errorRespondCloseRequest: "Failed to respond to close request.",
    errorForceClose: "Failed to force close position.",
    closingEvidenceRequired: "Closing evidence is required for force close.",
    errorRequestPayout: "Failed to request payout.",
    payoutCreated: "Payout request created.",
    errorStartFirmPayment: "Failed to start firm profit payment.",
    stripeLinkCreated: "Stripe payment link created.",
    bankTransferCreated: "Bank-transfer request created. Use the displayed IBAN and reference, then upload the transfer receipt.",
    proofSubmitted: "Transfer proof submitted. Admin must verify the bank transfer before it is marked paid.",
    transferProofRequired: "Transfer proof image is required.",
    errorStartBankTransfer: "Failed to start bank-transfer payment.",
    errorSubmitProof: "Failed to submit transfer proof.",
    saving: "Saving...",
    payWithStripe: "Pay online with Stripe",
    payByBankTransfer: "Bank transfer / IBAN",
    submitTransferProof: "Submit transfer proof",
    bankDetails: "Bank details",
    beneficiary: "Beneficiary",
    bank: "Bank",
    iban: "IBAN",
    swift: "SWIFT",
    reference: "Reference",
    method: "Method",
    transferReference: "Transfer reference",
    transferReferencePlaceholder: "Bank transfer reference / note",
    uploadReceipt: "Upload receipt image",
    proof: "Proof",
    reviewNote: "Review note",
    payFirmProfit: "Pay firm profit",
    portfolioOverview: "Portfolio overview",
    portfolioOverviewDesc:
      "Free capital moves automatically when you open or close positions.",
    freeCapital: "Free capital",
    moneyInMarket: "Money in market",
    totalEquity: "Total equity",
    overallProfit: "Overall profit",
    firmProfit: "Firm profit",
    investorProfit: "Investor profit",
    firmProfitPaid: "Firm profit paid",
    firmProfitOutstanding: "Firm profit outstanding",
    profitNotice:
      "You only pay the firm share that has actually been realized on closed positions. Paid amount:",
    remainingDue: "Remaining due:",
    firmProfitPayments: "Firm profit payments",
    firmProfitPaymentsDesc:
      "Stripe and verified bank-transfer payments are tracked here and matched against your closures.",
    noFirmPayments: "No firm profit payments yet.",
    requested: "Requested",
    paid: "Paid",
    status: "Status",
    created: "Created",
    paidAt: "Paid at",
    openPositions: "Open positions",
    noOpenPositions: "No open positions yet.",
    symbol: "Symbol",
    qty: "Qty",
    entry: "Entry",
    current: "Current",
    invested: "Invested",
    marketValue: "Market value",
    unrealized: "Unrealized",
    closeRequestFor: "Close request for",
    openQty: "Open qty",
    closeQuantity: "Close quantity",
    requestedExitPrice: "Requested exit price",
    requestClose: "Request close",
    forceClose: "Force close",
    uploading: "Uploading...",
    reasonOrNote: "Reason or note",
    closeRequests: "Close requests",
    closeRequestsDesc:
      "Admin requests wait for your answer. Investor requests stay visible here with their evidence.",
    noCloseRequests: "No close requests yet.",
    from: "From",
    marketNone: "Market/none",
    openClosingEvidence: "Open closing evidence",
    optionalReply: "Optional reply",
    approveClose: "Approve close",
    reject: "Reject",
    closureHistory: "Closure history",
    closureHistoryDesc: "Overall profit, firm profit, and your net profit.",
    noClosures: "No closures recorded yet.",
    exit: "Exit",
    evidence: "Evidence",
    closed: "Closed",
    viewImage: "View image",
    admin: "Admin",
    investor: "Investor",
    notAvailable: "—",
  },
  ar: {
    loading: "جارٍ تحميل المحفظة...",
    errorLoad: "فشل في تحميل المحفظة.",
    stripeCompleted:
      "اكتملت عملية الدفع عبر Stripe. سيظهر مبلغ ربح الشركة المدفوع هنا بعد تأكيد الـ webhook.",
    stripeCancelled: "تم إلغاء دفع ربح الشركة.",
    errorCreateCloseRequest: "فشل في إنشاء طلب الإغلاق.",
    errorRespondCloseRequest: "فشل في الرد على طلب الإغلاق.",
    errorForceClose: "فشل في الإغلاق الإجباري للمركز.",
    closingEvidenceRequired: "إثبات الإغلاق مطلوب للإغلاق الإجباري.",
    errorRequestPayout: "فشل في طلب السحب.",
    payoutCreated: "تم إنشاء طلب السحب.",
    errorStartFirmPayment: "فشل في بدء دفع ربح الشركة.",
    stripeLinkCreated: "تم إنشاء رابط دفع Stripe.",
    bankTransferCreated: "تم إنشاء طلب التحويل البنكي. استخدم رقم الآيبان والمرجع الظاهرين ثم ارفع إيصال التحويل.",
    proofSubmitted: "تم إرسال إثبات التحويل. يجب على المدير التحقق من التحويل البنكي قبل اعتباره مدفوعًا.",
    transferProofRequired: "صورة إثبات التحويل مطلوبة.",
    errorStartBankTransfer: "فشل في بدء الدفع عبر التحويل البنكي.",
    errorSubmitProof: "فشل في إرسال إثبات التحويل.",
    saving: "جارٍ الحفظ...",
    payWithStripe: "الدفع الإلكتروني عبر Stripe",
    payByBankTransfer: "تحويل بنكي / آيبان",
    submitTransferProof: "إرسال إثبات التحويل",
    bankDetails: "تفاصيل البنك",
    beneficiary: "المستفيد",
    bank: "البنك",
    iban: "الآيبان",
    swift: "SWIFT",
    reference: "المرجع",
    method: "الطريقة",
    transferReference: "مرجع التحويل",
    transferReferencePlaceholder: "مرجع التحويل البنكي / الملاحظة",
    uploadReceipt: "رفع صورة الإيصال",
    proof: "الإثبات",
    reviewNote: "ملاحظة المراجعة",
    payFirmProfit: "دفع ربح الشركة",
    portfolioOverview: "نظرة عامة على المحفظة",
    portfolioOverviewDesc:
      "يتم تحديث رأس المال الحر تلقائيًا عند فتح المراكز أو إغلاقها.",
    freeCapital: "رأس المال الحر",
    moneyInMarket: "الأموال في السوق",
    totalEquity: "إجمالي حقوق الملكية",
    overallProfit: "إجمالي الربح",
    firmProfit: "ربح الشركة",
    investorProfit: "ربح المستثمر",
    firmProfitPaid: "ربح الشركة المدفوع",
    firmProfitOutstanding: "ربح الشركة المستحق",
    profitNotice:
      "أنت تدفع فقط حصة الشركة التي تحققت فعليًا من المراكز المغلقة. المبلغ المدفوع:",
    remainingDue: "المتبقي المستحق:",
    firmProfitPayments: "مدفوعات ربح الشركة",
    firmProfitPaymentsDesc:
      "يتم تتبع مدفوعات Stripe والتحويلات البنكية المعتمدة هنا وربطها بعمليات الإغلاق الخاصة بك.",
    noFirmPayments: "لا توجد مدفوعات لربح الشركة حتى الآن.",
    requested: "المطلوب",
    paid: "المدفوع",
    status: "الحالة",
    created: "تاريخ الإنشاء",
    paidAt: "تاريخ الدفع",
    openPositions: "المراكز المفتوحة",
    noOpenPositions: "لا توجد مراكز مفتوحة حتى الآن.",
    symbol: "الرمز",
    qty: "الكمية",
    entry: "سعر الدخول",
    current: "السعر الحالي",
    invested: "المبلغ المستثمر",
    marketValue: "القيمة السوقية",
    unrealized: "الربح غير المحقق",
    closeRequestFor: "طلب إغلاق لـ",
    openQty: "الكمية المفتوحة",
    closeQuantity: "كمية الإغلاق",
    requestedExitPrice: "سعر الخروج المطلوب",
    requestClose: "طلب إغلاق",
    forceClose: "إغلاق إجباري",
    uploading: "جارٍ الرفع...",
    reasonOrNote: "السبب أو الملاحظة",
    closeRequests: "طلبات الإغلاق",
    closeRequestsDesc:
      "طلبات المدير تنتظر ردك. أما طلبات المستثمر فتبقى ظاهرة هنا مع الإثباتات.",
    noCloseRequests: "لا توجد طلبات إغلاق حتى الآن.",
    from: "من",
    marketNone: "سوق / بدون",
    openClosingEvidence: "فتح إثبات الإغلاق",
    optionalReply: "رد اختياري",
    approveClose: "موافقة على الإغلاق",
    reject: "رفض",
    closureHistory: "سجل الإغلاقات",
    closureHistoryDesc: "إجمالي الربح وربح الشركة وصافي ربحك.",
    noClosures: "لا توجد عمليات إغلاق مسجلة حتى الآن.",
    exit: "سعر الخروج",
    evidence: "الإثبات",
    closed: "تاريخ الإغلاق",
    viewImage: "عرض الصورة",
    admin: "المدير",
    investor: "المستثمر",
    notAvailable: "—",
  },
} satisfies Record<Lang, Record<string, string>>;

function getRoleLabel(role: string | null | undefined, lang: Lang) {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "ADMIN") return translations[lang].admin;
  if (normalized === "INVESTOR") return translations[lang].investor;
  return role || translations[lang].notAvailable;
}

function formatMoney(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string | null | undefined, lang: Lang) {
  if (!value) return translations[lang].notAvailable;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return translations[lang].notAvailable;
  return date.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
}

export default function ElitePortfolioPage({ lang = "en" }: { lang?: Lang }) {
  const t = translations[lang];
  const isArabic = lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const textAlign = isArabic ? "text-right" : "text-left";
  const numericInputClass = "dir-ltr text-left";
  const textareaClass = isArabic ? "text-right" : "text-left";

  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/elite/portfolio", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.errorLoad);
      setData(json);
    } catch (err: any) {
      setError(err.message || t.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [t.errorLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("firmProfitPayment");
    if (paymentStatus === "success") {
      setInfo(t.stripeCompleted);
      loadData();
    } else if (paymentStatus === "cancelled") {
      setInfo(t.stripeCancelled);
    }
  }, [loadData, t.stripeCancelled, t.stripeCompleted]);

  async function requestClose(positionId: number) {
    setError(null);
    setInfo(null);
    setBusyKey(`request-${positionId}`);
    try {
      const evidenceFile = (
        document.getElementById(
          `close-file-${positionId}`,
        ) as HTMLInputElement | null
      )?.files?.[0];

      let evidenceUrl: string | null = null;
      let evidenceName: string | null = null;
      if (evidenceFile) {
        const uploaded = await uploadEvidence(evidenceFile, "closing");
        evidenceUrl = uploaded.url;
        evidenceName = uploaded.name;
      }

      const res = await fetch("/api/elite/closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId,
          requestedQuantity: Number(state[`qty-${positionId}`] || 0),
          requestedExitPrice: state[`exit-${positionId}`]
            ? Number(state[`exit-${positionId}`])
            : null,
          requestNote: state[`note-${positionId}`] || null,
          evidenceUrl,
          evidenceName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.errorCreateCloseRequest);
      await loadData();
    } catch (err: any) {
      setError(err.message || t.errorCreateCloseRequest);
    } finally {
      setBusyKey(null);
    }
  }

  async function respond(requestId: number, decision: "ACCEPTED" | "REJECTED") {
    setError(null);
    setInfo(null);
    setBusyKey(`respond-${requestId}-${decision}`);
    try {
      let evidenceUrl: string | null = null;
      let evidenceName: string | null = null;

      if (decision === "ACCEPTED") {
        const evidenceFile = (
          document.getElementById(
            `reply-file-${requestId}`,
          ) as HTMLInputElement | null
        )?.files?.[0];

        if (evidenceFile) {
          const uploaded = await uploadEvidence(evidenceFile, "closing");
          evidenceUrl = uploaded.url;
          evidenceName = uploaded.name;
        }
      }

      const res = await fetch("/api/elite/closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESPOND",
          requestId,
          decision,
          responseNote: state[`reply-${requestId}`] || null,
          evidenceUrl,
          evidenceName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.errorRespondCloseRequest);
      await loadData();
    } catch (err: any) {
      setError(err.message || t.errorRespondCloseRequest);
    } finally {
      setBusyKey(null);
    }
  }

  async function forceClose(positionId: number) {
    setError(null);
    setInfo(null);
    setBusyKey(`force-${positionId}`);
    try {
      const evidenceFile = (
        document.getElementById(
          `close-file-${positionId}`,
        ) as HTMLInputElement | null
      )?.files?.[0];

      if (!evidenceFile) {
        throw new Error(t.closingEvidenceRequired);
      }

      const uploaded = await uploadEvidence(evidenceFile, "closing");

      const res = await fetch("/api/elite/closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FORCE_CLOSE",
          positionId,
          requestedQuantity: state[`qty-${positionId}`]
            ? Number(state[`qty-${positionId}`])
            : null,
          requestedExitPrice: state[`exit-${positionId}`]
            ? Number(state[`exit-${positionId}`])
            : null,
          requestNote: state[`note-${positionId}`] || null,
          evidenceUrl: uploaded.url,
          evidenceName: uploaded.name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.errorForceClose);
      await loadData();
    } catch (err: any) {
      setError(err.message || t.errorForceClose);
    } finally {
      setBusyKey(null);
    }
  }

  async function startStripeFirmPayment() {
    setError(null);
    setInfo(null);
    setBusyKey("pay-firm-profit-stripe");
    try {
      const res = await fetch("/api/elite/firm-profit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "STRIPE",
          returnPath: window.location.pathname,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.errorStartFirmPayment);
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      setInfo(json?.message || t.stripeLinkCreated);
    } catch (err: any) {
      setError(err.message || t.errorStartFirmPayment);
    } finally {
      setBusyKey(null);
    }
  }

  async function startBankTransferPayment() {
    setError(null);
    setInfo(null);
    setBusyKey("pay-firm-profit-bank");
    try {
      const res = await fetch("/api/elite/firm-profit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "BANK_TRANSFER" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.errorStartBankTransfer);
      setInfo(t.bankTransferCreated);
      await loadData();
    } catch (err: any) {
      setError(err.message || t.errorStartBankTransfer);
    } finally {
      setBusyKey(null);
    }
  }

  async function submitBankTransferProof(paymentId: number) {
    setError(null);
    setInfo(null);
    setBusyKey(`proof-${paymentId}`);
    try {
      const proofFile = (
        document.getElementById(
          `payment-proof-${paymentId}`,
        ) as HTMLInputElement | null
      )?.files?.[0];

      if (!proofFile) throw new Error(t.transferProofRequired);

      const uploaded = await uploadEvidence(proofFile, "payment");
      const res = await fetch(
        `/api/elite/firm-profit-payment/${paymentId}/proof`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proofUrl: uploaded.url,
            proofName: uploaded.name,
            transferReference: state[`transfer-reference-${paymentId}`] || null,
            note: state[`transfer-note-${paymentId}`] || null,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.errorSubmitProof);
      setInfo(t.proofSubmitted);
      await loadData();
    } catch (err: any) {
      setError(err.message || t.errorSubmitProof);
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) return <LoadingBlock label={t.loading} />;
  if (!data) return null;

  return (
    <div dir={dir} className={`space-y-6 ${textAlign}`}>
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

      <SectionCard
        title={t.portfolioOverview}
        description={t.portfolioOverviewDesc}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={
                busyKey === "pay-firm-profit-stripe" ||
                data.summary.firmProfitOutstanding <= 0
              }
              onClick={startStripeFirmPayment}
            >
              {busyKey === "pay-firm-profit-stripe" ? t.saving : t.payWithStripe}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                busyKey === "pay-firm-profit-bank" ||
                data.summary.firmProfitOutstanding <= 0
              }
              onClick={startBankTransferPayment}
            >
              {busyKey === "pay-firm-profit-bank" ? t.saving : t.payByBankTransfer}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t.freeCapital}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatMoney(data.summary.freeCapitalAmount, lang)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t.moneyInMarket}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatMoney(data.summary.moneyInMarket, lang)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t.totalEquity}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatMoney(data.summary.totalEquity, lang)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t.overallProfit}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatMoney(data.summary.overallProfit, lang)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t.firmProfit}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatMoney(data.summary.firmProfit, lang)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t.investorProfit}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatMoney(data.summary.investorProfit, lang)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">
              {t.firmProfitPaid}
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-900">
              {formatMoney(data.summary.firmProfitPaid, lang)}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">
              {t.firmProfitOutstanding}
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">
              {formatMoney(data.summary.firmProfitOutstanding, lang)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {t.profitNotice}{" "}
          <span className="font-semibold">
            {formatMoney(data.summary.firmProfitPaid, lang)}
          </span>
          . {t.remainingDue}{" "}
          <span className="font-semibold">
            {formatMoney(data.summary.firmProfitOutstanding, lang)}
          </span>
          .
        </div>
      </SectionCard>

      <SectionCard
        title={t.firmProfitPayments}
        description={t.firmProfitPaymentsDesc}
      >
        {data.firmPayments.length === 0 ? (
          <p className="text-sm text-slate-500">{t.noFirmPayments}</p>
        ) : (
          <div className="space-y-4">
            {data.firmPayments.map((payment) => {
              const method = String(payment.paymentMethod || "STRIPE").toUpperCase();
              const canSubmitProof =
                method === "BANK_TRANSFER" &&
                ["AWAITING_TRANSFER", "REJECTED"].includes(
                  String(payment.status || "").toUpperCase(),
                );

              return (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={payment.status} />
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                          {method === "BANK_TRANSFER"
                            ? t.payByBankTransfer
                            : t.payWithStripe}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {t.requested}: {formatMoney(payment.amountRequested, lang)} • {t.paid}: {formatMoney(payment.amountPaid, lang)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.created}: {formatDate(payment.createdAt, lang)} • {t.paidAt}: {payment.paidAt ? formatDate(payment.paidAt, lang) : t.notAvailable}
                      </p>
                    </div>
                    {payment.proofUrl ? (
                      <a
                        href={payment.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 underline"
                      >
                        {t.proof}
                      </a>
                    ) : null}
                  </div>

                  {method === "BANK_TRANSFER" ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{t.bankDetails}</p>
                        <dl className="mt-3 space-y-2">
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">{t.beneficiary}</dt>
                            <dd className="font-semibold">{payment.bankAccountName || t.notAvailable}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">{t.bank}</dt>
                            <dd className="font-semibold">{payment.bankName || t.notAvailable}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">{t.iban}</dt>
                            <dd className="font-mono text-sm break-all" dir="ltr">{payment.iban || t.notAvailable}</dd>
                          </div>
                          {payment.swiftCode ? (
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-slate-500">{t.swift}</dt>
                              <dd className="font-mono text-sm" dir="ltr">{payment.swiftCode}</dd>
                            </div>
                          ) : null}
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">{t.reference}</dt>
                            <dd className="font-mono text-sm break-all" dir="ltr">{payment.manualReference || t.notAvailable}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">{t.uploadReceipt}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {payment.reviewNote ? `${t.reviewNote}: ${payment.reviewNote}` : t.notAvailable}
                        </p>
                        {canSubmitProof ? (
                          <div className="mt-4 space-y-3">
                            <Input
                              type="text"
                              placeholder={t.transferReferencePlaceholder}
                              value={state[`transfer-reference-${payment.id}`] || ""}
                              onChange={(e) =>
                                setState((current) => ({
                                  ...current,
                                  [`transfer-reference-${payment.id}`]: e.target.value,
                                }))
                              }
                            />
                            <Input id={`payment-proof-${payment.id}`} type="file" accept={EVIDENCE_IMAGE_ACCEPT} />
                            <Button
                              type="button"
                              disabled={busyKey === `proof-${payment.id}`}
                              onClick={() => submitBankTransferProof(payment.id)}
                            >
                              {busyKey === `proof-${payment.id}` ? t.uploading : t.submitTransferProof}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t.openPositions}>
        {data.openPositions.length === 0 ? (
          <p className="text-sm text-slate-500">{t.noOpenPositions}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead
                className={`${isArabic ? "text-right" : "text-left"} bg-slate-50 text-slate-600`}
              >
                <tr>
                  <th className="px-4 py-3 font-semibold">{t.symbol}</th>
                  <th className="px-4 py-3 font-semibold">{t.qty}</th>
                  <th className="px-4 py-3 font-semibold">{t.entry}</th>
                  <th className="px-4 py-3 font-semibold">{t.current}</th>
                  <th className="px-4 py-3 font-semibold">{t.invested}</th>
                  <th className="px-4 py-3 font-semibold">{t.marketValue}</th>
                  <th className="px-4 py-3 font-semibold">{t.unrealized}</th>
                  <th className="px-4 py-3 font-semibold">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.openPositions.map((position) => (
                  <tr key={position.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {position.symbol}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDate(position.openedAt, lang)}
                      </div>
                    </td>
                    <td className="px-4 py-4">{position.quantityOpen}</td>
                    <td className="px-4 py-4">
                      {formatMoney(position.entryPrice, lang)}
                    </td>
                    <td className="px-4 py-4">
                      {formatMoney(position.currentPrice, lang)}
                    </td>
                    <td className="px-4 py-4">
                      {formatMoney(position.investedAmount, lang)}
                    </td>
                    <td className="px-4 py-4">
                      {formatMoney(position.marketValue, lang)}
                    </td>
                    <td className="px-4 py-4">
                      {formatMoney(position.unrealizedProfit, lang)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={position.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 space-y-5">
          {data.openPositions.map((position) => (
            <div
              key={`form-${position.id}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div
                className={`flex flex-wrap items-center justify-between gap-3 ${isArabic ? "text-right" : "text-left"}`}
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {t.closeRequestFor} {position.symbol}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {t.current} {formatMoney(position.currentPrice, lang)} •{" "}
                    {t.openQty} {position.quantityOpen}
                  </p>
                </div>
                <StatusBadge status={position.status} />
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <Input
                  dir="ltr"
                  className={numericInputClass}
                  type="number"
                  placeholder={t.closeQuantity}
                  value={state[`qty-${position.id}`] || ""}
                  onChange={(e) =>
                    setState((current) => ({
                      ...current,
                      [`qty-${position.id}`]: e.target.value,
                    }))
                  }
                />
                <Input
                  dir="ltr"
                  className={numericInputClass}
                  type="number"
                  placeholder={t.requestedExitPrice}
                  value={state[`exit-${position.id}`] || ""}
                  onChange={(e) =>
                    setState((current) => ({
                      ...current,
                      [`exit-${position.id}`]: e.target.value,
                    }))
                  }
                />
                <Input
                  dir="ltr"
                  className="text-left"
                  id={`close-file-${position.id}`}
                  type="file"
                  accept={EVIDENCE_IMAGE_ACCEPT}
                />
                <div className="flex flex-wrap gap-2 lg:col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyKey === `request-${position.id}`}
                    onClick={() => requestClose(position.id)}
                  >
                    {busyKey === `request-${position.id}`
                      ? t.uploading
                      : t.requestClose}
                  </Button>
                  <Button
                    type="button"
                    className="bg-blue-700 hover:bg-blue-800"
                    disabled={busyKey === `force-${position.id}`}
                    onClick={() => forceClose(position.id)}
                  >
                    {busyKey === `force-${position.id}`
                      ? t.uploading
                      : t.forceClose}
                  </Button>
                </div>
                <div className="lg:col-span-4">
                  <Textarea
                    dir={dir}
                    className={textareaClass}
                    placeholder={t.reasonOrNote}
                    value={state[`note-${position.id}`] || ""}
                    onChange={(e) =>
                      setState((current) => ({
                        ...current,
                        [`note-${position.id}`]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t.closeRequests} description={t.closeRequestsDesc}>
        <div className="space-y-4">
          {data.closeRequests.length === 0 ? (
            <p className="text-sm text-slate-500">{t.noCloseRequests}</p>
          ) : (
            data.closeRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={request.status} />
                      <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        {t.from} {getRoleLabel(request.initiatedByRole, lang)}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600">
                      {t.qty} {request.requestedQuantity} •{" "}
                      {t.requestedExitPrice}{" "}
                      {request.requestedExitPrice == null
                        ? t.marketNone
                        : formatMoney(request.requestedExitPrice, lang)}{" "}
                      • {formatDate(request.createdAt, lang)}
                    </p>

                    {request.requestNote ? (
                      <p className="text-sm text-slate-500">
                        {request.requestNote}
                      </p>
                    ) : null}

                    {request.evidenceUrl ? (
                      <a
                        href={request.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-semibold text-blue-700 underline"
                      >
                        {t.openClosingEvidence}
                      </a>
                    ) : null}
                  </div>

                  {request.status === "PENDING" &&
                  request.initiatedByRole === "ADMIN" ? (
                    <div className="space-y-2">
                      <Textarea
                        dir={dir}
                        className={textareaClass}
                        placeholder={t.optionalReply}
                        value={state[`reply-${request.id}`] || ""}
                        onChange={(e) =>
                          setState((current) => ({
                            ...current,
                            [`reply-${request.id}`]: e.target.value,
                          }))
                        }
                      />
                      <Input
                        dir="ltr"
                        className="text-left"
                        id={`reply-file-${request.id}`}
                        type="file"
                        accept={EVIDENCE_IMAGE_ACCEPT}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          disabled={
                            busyKey === `respond-${request.id}-ACCEPTED`
                          }
                          onClick={() => respond(request.id, "ACCEPTED")}
                        >
                          {busyKey === `respond-${request.id}-ACCEPTED`
                            ? t.saving
                            : t.approveClose}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            busyKey === `respond-${request.id}-REJECTED`
                          }
                          onClick={() => respond(request.id, "REJECTED")}
                        >
                          {busyKey === `respond-${request.id}-REJECTED`
                            ? t.saving
                            : t.reject}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title={t.closureHistory} description={t.closureHistoryDesc}>
        {data.closures.length === 0 ? (
          <p className="text-sm text-slate-500">{t.noClosures}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead
                className={`${isArabic ? "text-right" : "text-left"} bg-slate-50 text-slate-600`}
              >
                <tr>
                  <th className="px-4 py-3 font-semibold">{t.symbol}</th>
                  <th className="px-4 py-3 font-semibold">{t.qty}</th>
                  <th className="px-4 py-3 font-semibold">{t.exit}</th>
                  <th className="px-4 py-3 font-semibold">{t.overallProfit}</th>
                  <th className="px-4 py-3 font-semibold">{t.firmProfit}</th>
                  <th className="px-4 py-3 font-semibold">
                    {t.firmProfitPaid}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {t.investorProfit}
                  </th>
                  <th className="px-4 py-3 font-semibold">{t.evidence}</th>
                  <th className="px-4 py-3 font-semibold">{t.closed}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.closures.map((closure) => {
                  const investorNet =
                    closure.realizedProfitAmount -
                    closure.firmShareAmount -
                    closure.partnerShareAmount;

                  return (
                    <tr key={closure.id}>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {closure.symbol}
                      </td>
                      <td className="px-4 py-4">{closure.closedQuantity}</td>
                      <td className="px-4 py-4">
                        {formatMoney(closure.exitPrice, lang)}
                      </td>
                      <td className="px-4 py-4">
                        {formatMoney(closure.realizedProfitAmount, lang)}
                      </td>
                      <td className="px-4 py-4">
                        {formatMoney(closure.firmShareAmount, lang)}
                      </td>
                      <td className="px-4 py-4">
                        {formatMoney(closure.firmPaidAmount, lang)}
                      </td>
                      <td className="px-4 py-4">
                        {formatMoney(investorNet, lang)}
                      </td>
                      <td className="px-4 py-4">
                        {closure.evidenceUrl ? (
                          <a
                            href={closure.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-700 underline"
                          >
                            {t.viewImage}
                          </a>
                        ) : (
                          t.notAvailable
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {formatDate(closure.closedAt, lang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
