"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LoadingBlock,
  SectionCard,
  StatusBadge,
  money,
  shortDate,
} from "@/components/program/shared";
import { EVIDENCE_IMAGE_ACCEPT, uploadEvidence } from "@/lib/evidence-upload";

interface PlanMessage {
  id: number;
  senderRole: string;
  messageText: string;
  createdAt: string;
}

interface PlanRow {
  id: number;
  symbol: string;
  companyName?: string | null;
  referenceMarketPrice: number;
  targetEntryPrice: number;
  targetPrice1?: number | null;
  targetPrice2?: number | null;
  stopLossPrice?: number | null;
  suggestedQuantity: number;
  plannedAt: string;
  adminNote?: string | null;
  investorDecision: string;
  investorNote?: string | null;
  status: string;
  execution?: {
    id: number;
    executedQuantity: number;
    executedPrice: number;
    executedAt: string;
    screenshotUrl?: string | null;
    screenshotName?: string | null;
    investorNote?: string | null;
    status: string;
  } | null;
  messages: PlanMessage[];
}

interface PortfolioSummaryResponse {
  currentCapitalAmount: number;
  summary?: {
    freeCapitalAmount?: number;
    moneyInMarket?: number;
    totalEquity?: number;
  };
}

const translations = {
  en: {
    loading: "Loading plans...",
    loadPlansError: "Failed to load plans.",
    loadPortfolioSummaryError: "Failed to load portfolio summary.",
    updateCapitalError: "Failed to update capital.",
    sendDecisionError: "Failed to send decision.",
    respondPlanError: "Failed to respond to plan.",
    sendMessageError: "Failed to send message.",
    submitExecutionError: "Failed to submit execution.",
    sectionTitle: "Free capital",
    sectionDescription:
      "This is your available capital. It decreases when you open positions and increases again when positions are closed.",
    saveCapital: "Update free capital",
    saving: "Saving...",
    freeCapital: "Free capital",
    moneyInMarket: "Money in market",
    totalEquity: "Total equity",
    tradePlans: "Trade plans",
    tradePlansDescription: (total: number, pending: number) =>
      `You currently have ${total} plans and ${pending} plans waiting for a decision or execution.`,
    suggestedAllocation: "Suggested allocation",
    noCompany: "No company name provided",
    referencePrice: "Reference price",
    targetEntry: "Target entry",
    target1: "Target 1",
    target2: "Target 2",
    suggestedQuantity: "Suggested quantity",
    adminNote: "Admin note",
    decisionNotePlaceholder: "Decision note for the admin",
    acceptPlan: "Accept plan",
    rejectPlan: "Reject plan",
    investorDecisionSaved: "Investor decision saved",
    actualQuantity: "Actual quantity",
    actualEntryPrice: "Actual entry price",
    submitExecution: "Submit execution",
    uploading: "Uploading...",
    executionNotePlaceholder: "Optional note about what you actually executed.",
    capitalReductionNote:
      "Your free capital will be reduced by the actual filled amount after the execution is saved.",
    executedSummary: (qty: number, price: string, date: string) =>
      `Executed ${qty} shares at ${price} on ${date}.`,
    openEvidence: "Open execution evidence",
    notesWithAdmin: "Notes with admin",
    noNotes: "No notes yet.",
    sendNoteTitle: "Send a note",
    sendNotePlaceholder: "Ask a question or clarify your execution.",
    sendNote: "Send note",
    sending: "Sending...",
  },
  ar: {
    loading: "جاري تحميل الخطط...",
    loadPlansError: "فشل في تحميل الخطط.",
    loadPortfolioSummaryError: "فشل في تحميل ملخص المحفظة.",
    updateCapitalError: "فشل في تحديث رأس المال.",
    sendDecisionError: "فشل في إرسال القرار.",
    respondPlanError: "فشل في الرد على الخطة.",
    sendMessageError: "فشل في إرسال الملاحظة.",
    submitExecutionError: "فشل في إرسال التنفيذ.",
    sectionTitle: "رأس المال الحر",
    sectionDescription:
      "هذا هو رأس المال المتاح لديك. ينخفض عند فتح المراكز ويرتفع مجدداً عند إغلاقها.",
    saveCapital: "تحديث رأس المال الحر",
    saving: "جاري الحفظ...",
    freeCapital: "رأس المال الحر",
    moneyInMarket: "الأموال داخل السوق",
    totalEquity: "إجمالي حقوق الملكية",
    tradePlans: "خطط التداول",
    tradePlansDescription: (total: number, pending: number) =>
      `لديك حالياً ${total} خطة، وهناك ${pending} خطة بانتظار قرار أو تنفيذ.`,
    suggestedAllocation: "حجم التخصيص المقترح",
    noCompany: "لا يوجد اسم شركة",
    referencePrice: "السعر المرجعي",
    targetEntry: "سعر الدخول المستهدف",
    target1: "الهدف الأول",
    target2: "الهدف الثاني",
    suggestedQuantity: "الكمية المقترحة",
    adminNote: "ملاحظة المشرف",
    decisionNotePlaceholder: "ملاحظة القرار للمشرف",
    acceptPlan: "قبول الخطة",
    rejectPlan: "رفض الخطة",
    investorDecisionSaved: "تم حفظ قرار المستثمر",
    actualQuantity: "الكمية الفعلية",
    actualEntryPrice: "سعر الدخول الفعلي",
    submitExecution: "إرسال التنفيذ",
    uploading: "جاري الرفع...",
    executionNotePlaceholder: "ملاحظة اختيارية حول ما قمت بتنفيذه فعلياً.",
    capitalReductionNote:
      "سيتم خصم رأس المال الحر بناءً على قيمة التنفيذ الفعلية بعد حفظ التنفيذ.",
    executedSummary: (qty: number, price: string, date: string) =>
      `تم تنفيذ ${qty} سهم بسعر ${price} بتاريخ ${date}.`,
    openEvidence: "فتح إثبات التنفيذ",
    notesWithAdmin: "الملاحظات مع المشرف",
    noNotes: "لا توجد ملاحظات بعد.",
    sendNoteTitle: "إرسال ملاحظة",
    sendNotePlaceholder: "اطرح سؤالاً أو وضّح تنفيذك.",
    sendNote: "إرسال الملاحظة",
    sending: "جاري الإرسال...",
  },
} as const;

export default function ElitePlanPage({ lang = "en" }: { lang?: "en" | "ar" }) {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capital, setCapital] = useState(0);
  const [portfolioSummary, setPortfolioSummary] =
    useState<PortfolioSummaryResponse | null>(null);
  const [capitalInput, setCapitalInput] = useState("");
  const [savingCapital, setSavingCapital] = useState(false);
  const [actionState, setActionState] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const t = translations[lang];
  const isArabic = lang === "ar";

  const loadData = useCallback(async () => {
    try {
      const [planRes, portfolioRes] = await Promise.all([
        fetch("/api/elite/plan", { cache: "no-store" }),
        fetch("/api/elite/portfolio", { cache: "no-store" }),
      ]);
      const plansJson = await planRes.json();
      const portfolioJson = await portfolioRes.json();
      if (!planRes.ok) {
        throw new Error(plansJson?.message || t.loadPlansError);
      }
      if (!portfolioRes.ok) {
        throw new Error(portfolioJson?.message || t.loadPortfolioSummaryError);
      }

      setPlans(Array.isArray(plansJson) ? plansJson : []);
      setPortfolioSummary(portfolioJson);
      setCapital(Number(portfolioJson?.currentCapitalAmount || 0));
      setCapitalInput(String(portfolioJson?.currentCapitalAmount || 0));
    } catch (err: any) {
      setError(err.message || t.loadPlansError);
    } finally {
      setLoading(false);
    }
  }, [t.loadPlansError, t.loadPortfolioSummaryError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCount = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan.status === "SENT" ||
          (plan.status === "ACCEPTED_BY_INVESTOR" && !plan.execution),
      ).length,
    [plans],
  );

  async function updateCapital(event: FormEvent) {
    event.preventDefault();
    setSavingCapital(true);
    setError(null);
    try {
      const res = await fetch("/api/elite/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCapitalAmount: Number(capitalInput),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.updateCapitalError);
      setCapital(Number(json.currentCapitalAmount || 0));
      setCapitalInput(String(Number(json.currentCapitalAmount || 0)));
      await loadData();
    } catch (err: any) {
      setError(err.message || t.updateCapitalError);
    } finally {
      setSavingCapital(false);
    }
  }

  async function respond(planId: number, decision: "ACCEPTED" | "REJECTED") {
    const note = actionState[`decision-${planId}`] || "";
    setError(null);
    setBusyKey(`respond-${planId}-${decision}`);
    try {
      const res = await fetch(`/api/elite/plan/${planId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.sendDecisionError);
      await loadData();
    } catch (err: any) {
      setError(err.message || t.respondPlanError);
    } finally {
      setBusyKey(null);
    }
  }

  async function sendMessage(planId: number) {
    const message = actionState[`msg-${planId}`] || "";
    if (!message.trim()) return;
    setError(null);
    setBusyKey(`msg-${planId}`);
    try {
      const res = await fetch(`/api/elite/plan/${planId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.sendMessageError);
      setActionState((current) => ({ ...current, [`msg-${planId}`]: "" }));
      await loadData();
    } catch (err: any) {
      setError(err.message || t.sendMessageError);
    } finally {
      setBusyKey(null);
    }
  }

  async function submitExecution(planId: number) {
    setError(null);
    setBusyKey(`execute-${planId}`);
    try {
      const screenshotFile = (
        document.getElementById(`file-${planId}`) as HTMLInputElement | null
      )?.files?.[0];

      let screenshotUrl: string | null = null;
      let screenshotName: string | null = null;
      if (screenshotFile) {
        const uploaded = await uploadEvidence(screenshotFile, "opening");
        screenshotUrl = uploaded.url;
        screenshotName = uploaded.name;
      }

      const res = await fetch("/api/elite/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          executedQuantity: Number(actionState[`qty-${planId}`] || 0),
          executedPrice: Number(actionState[`price-${planId}`] || 0),
          executedAt: actionState[`at-${planId}`] || new Date().toISOString(),
          investorNote: actionState[`execnote-${planId}`] || null,
          screenshotUrl,
          screenshotName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || t.submitExecutionError);

      if (json?.currentCapitalAmount != null) {
        setCapital(Number(json.currentCapitalAmount));
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || t.submitExecutionError);
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) return <LoadingBlock label={t.loading} />;

  const freeCapital =
    Number(portfolioSummary?.summary?.freeCapitalAmount ?? capital) || 0;
  const moneyInMarket =
    Number(portfolioSummary?.summary?.moneyInMarket || 0) || 0;
  const totalEquity =
    Number(portfolioSummary?.summary?.totalEquity || freeCapital) || 0;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-6 ${isArabic ? "text-right" : ""}`}
    >
      <SectionCard title={t.sectionTitle} description={t.sectionDescription}>
        <form
          className="grid gap-3 lg:grid-cols-[180px,180px,1fr,auto]"
          onSubmit={updateCapital}
        >
          <Input
            type="number"
            value={capitalInput}
            onChange={(e) => setCapitalInput(e.target.value)}
            min={0}
            dir="ltr"
          />
          <Button type="submit" disabled={savingCapital}>
            {savingCapital ? t.saving : t.saveCapital}
          </Button>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {t.freeCapital}
              <div className="mt-1 font-semibold text-slate-900" dir="ltr">
                {money(freeCapital, lang)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {t.moneyInMarket}
              <div className="mt-1 font-semibold text-slate-900" dir="ltr">
                {money(moneyInMarket, lang)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {t.totalEquity}
              <div className="mt-1 font-semibold text-slate-900" dir="ltr">
                {money(totalEquity, lang)}
              </div>
            </div>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title={t.tradePlans}
        description={t.tradePlansDescription(plans.length, pendingCount)}
      >
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="space-y-5">
          {plans.map((plan) => {
            const suggestedAllocation =
              (plan.targetEntryPrice || plan.referenceMarketPrice || 0) *
              plan.suggestedQuantity;
            const decisionPending =
              plan.investorDecision === "PENDING" && plan.status === "SENT";

            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {plan.symbol}
                      </h3>
                      <StatusBadge status={plan.status} lang={lang} />
                      <StatusBadge status={plan.investorDecision} lang={lang} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {plan.companyName || t.noCompany} •{" "}
                      {shortDate(plan.plannedAt, lang)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {t.suggestedAllocation}
                    <div
                      className="mt-1 font-semibold text-slate-900"
                      dir="ltr"
                    >
                      {money(suggestedAllocation, lang)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-xl bg-slate-50 p-3">
                    {t.referencePrice}
                    <br />
                    <span className="font-semibold text-slate-900" dir="ltr">
                      {money(plan.referenceMarketPrice, lang)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    {t.targetEntry}
                    <br />
                    <span className="font-semibold text-slate-900" dir="ltr">
                      {money(plan.targetEntryPrice, lang)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    {t.target1}
                    <br />
                    <span className="font-semibold text-slate-900" dir="ltr">
                      {plan.targetPrice1 == null
                        ? "—"
                        : money(plan.targetPrice1, lang)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    {t.target2}
                    <br />
                    <span className="font-semibold text-slate-900" dir="ltr">
                      {plan.targetPrice2 == null
                        ? "—"
                        : money(plan.targetPrice2, lang)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    {t.suggestedQuantity}
                    <br />
                    <span className="font-semibold text-slate-900" dir="ltr">
                      {plan.suggestedQuantity}
                    </span>
                  </div>
                </div>

                {plan.adminNote ? (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                    {t.adminNote}: {plan.adminNote}
                  </div>
                ) : null}

                {!plan.execution ? (
                  <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {decisionPending ? (
                      <div className="grid gap-3 lg:grid-cols-[1fr,auto]">
                        <Textarea
                          value={actionState[`decision-${plan.id}`] || ""}
                          onChange={(e) =>
                            setActionState((current) => ({
                              ...current,
                              [`decision-${plan.id}`]: e.target.value,
                            }))
                          }
                          placeholder={t.decisionNotePlaceholder}
                          dir={isArabic ? "rtl" : "ltr"}
                        />
                        <div className="flex flex-wrap gap-2 self-start">
                          <Button
                            type="button"
                            disabled={busyKey === `respond-${plan.id}-ACCEPTED`}
                            onClick={() => respond(plan.id, "ACCEPTED")}
                          >
                            {busyKey === `respond-${plan.id}-ACCEPTED`
                              ? t.saving
                              : t.acceptPlan}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={busyKey === `respond-${plan.id}-REJECTED`}
                            onClick={() => respond(plan.id, "REJECTED")}
                          >
                            {busyKey === `respond-${plan.id}-REJECTED`
                              ? t.saving
                              : t.rejectPlan}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        {t.investorDecisionSaved}:{" "}
                        <span className="font-semibold text-slate-900">
                          <StatusBadge
                            status={plan.investorDecision}
                            lang={lang}
                          />
                        </span>
                        {plan.investorNote ? (
                          <span className="text-slate-500">
                            {" "}
                            • {plan.investorNote}
                          </span>
                        ) : null}
                      </div>
                    )}

                    {plan.investorDecision === "ACCEPTED" ? (
                      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-2 xl:grid-cols-5">
                        <Input
                          type="number"
                          placeholder={t.actualQuantity}
                          value={actionState[`qty-${plan.id}`] || ""}
                          onChange={(e) =>
                            setActionState((current) => ({
                              ...current,
                              [`qty-${plan.id}`]: e.target.value,
                            }))
                          }
                          dir="ltr"
                        />
                        <Input
                          type="number"
                          placeholder={t.actualEntryPrice}
                          value={actionState[`price-${plan.id}`] || ""}
                          onChange={(e) =>
                            setActionState((current) => ({
                              ...current,
                              [`price-${plan.id}`]: e.target.value,
                            }))
                          }
                          dir="ltr"
                        />
                        <Input
                          type="datetime-local"
                          value={actionState[`at-${plan.id}`] || ""}
                          onChange={(e) =>
                            setActionState((current) => ({
                              ...current,
                              [`at-${plan.id}`]: e.target.value,
                            }))
                          }
                          dir="ltr"
                        />
                        <Input
                          id={`file-${plan.id}`}
                          type="file"
                          accept={EVIDENCE_IMAGE_ACCEPT}
                          dir="ltr"
                        />
                        <Button
                          type="button"
                          disabled={busyKey === `execute-${plan.id}`}
                          onClick={() => submitExecution(plan.id)}
                        >
                          {busyKey === `execute-${plan.id}`
                            ? t.uploading
                            : t.submitExecution}
                        </Button>
                        <div className="space-y-2 xl:col-span-5">
                          <Textarea
                            value={actionState[`execnote-${plan.id}`] || ""}
                            onChange={(e) =>
                              setActionState((current) => ({
                                ...current,
                                [`execnote-${plan.id}`]: e.target.value,
                              }))
                            }
                            placeholder={t.executionNotePlaceholder}
                            dir={isArabic ? "rtl" : "ltr"}
                          />
                          <p className="text-xs text-slate-500">
                            {t.capitalReductionNote}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    {t.executedSummary(
                      plan.execution.executedQuantity,
                      money(plan.execution.executedPrice, lang),
                      shortDate(plan.execution.executedAt, lang),
                    )}
                    {plan.execution.screenshotUrl ? (
                      <div className="mt-3">
                        <a
                          href={plan.execution.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline"
                        >
                          {t.openEvidence}
                        </a>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {t.notesWithAdmin}
                    </p>
                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                      {plan.messages.length === 0 ? (
                        <p className="text-sm text-slate-500">{t.noNotes}</p>
                      ) : (
                        plan.messages.map((message) => (
                          <div
                            key={message.id}
                            className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
                          >
                            <p className="font-semibold text-slate-900">
                              {message.senderRole}
                            </p>
                            <p>{message.messageText}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {shortDate(message.createdAt, lang)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {t.sendNoteTitle}
                    </p>
                    <Textarea
                      value={actionState[`msg-${plan.id}`] || ""}
                      onChange={(e) =>
                        setActionState((current) => ({
                          ...current,
                          [`msg-${plan.id}`]: e.target.value,
                        }))
                      }
                      placeholder={t.sendNotePlaceholder}
                      dir={isArabic ? "rtl" : "ltr"}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busyKey === `msg-${plan.id}`}
                      onClick={() => sendMessage(plan.id)}
                    >
                      {busyKey === `msg-${plan.id}` ? t.sending : t.sendNote}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
