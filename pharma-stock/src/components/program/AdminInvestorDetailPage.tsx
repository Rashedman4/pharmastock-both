"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
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

interface InvestorDetail {
  memberId: number;
  investorName: string;
  email: string;
  phoneNumber: string;
  currentCapitalAmount: number;
  partnerName?: string | null;
  plans: any[];
  portfolio: {
    openPositions: any[];
    closeRequests: any[];
    closures: any[];
    firmPayments: any[];
    summary: {
      freeCapitalAmount: number;
      moneyInMarket: number;
      investedAtCost: number;
      totalEquity: number;
      openUnrealizedProfit: number;
      realizedProfit: number;
      overallProfit: number;
      firmProfit: number;
      firmProfitPaid: number;
      firmProfitOutstanding: number;
      partnerProfit: number;
      partnerShareUnlocked: number;
      investorProfit: number;
    };
  };
}

export default function AdminInvestorDetailPage({
  memberId,
}: {
  memberId: number;
}) {
  const [data, setData] = useState<InvestorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    symbol: "",
    companyName: "",
    referenceMarketPrice: "",
    targetEntryPrice: "",
    targetPrice1: "",
    targetPrice2: "",
    stopLossPrice: "",
    suggestedQuantity: "",
    plannedAt: "",
    adminNote: "",
  });
  const [state, setState] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/elite-portfolios/${memberId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to load investor detail.");
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load investor detail.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function createPlan(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusyKey("create-plan");
    try {
      const res = await fetch(`/api/admin/elite-portfolios/${memberId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...planForm,
          referenceMarketPrice: planForm.referenceMarketPrice
            ? Number(planForm.referenceMarketPrice)
            : null,
          targetEntryPrice: planForm.targetEntryPrice
            ? Number(planForm.targetEntryPrice)
            : null,
          targetPrice1: planForm.targetPrice1
            ? Number(planForm.targetPrice1)
            : null,
          targetPrice2: planForm.targetPrice2
            ? Number(planForm.targetPrice2)
            : null,
          stopLossPrice: planForm.stopLossPrice
            ? Number(planForm.stopLossPrice)
            : null,
          suggestedQuantity: Number(planForm.suggestedQuantity || 0),
          plannedAt: planForm.plannedAt || null,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to create trade plan.");
      setPlanForm({
        symbol: "",
        companyName: "",
        referenceMarketPrice: "",
        targetEntryPrice: "",
        targetPrice1: "",
        targetPrice2: "",
        stopLossPrice: "",
        suggestedQuantity: "",
        plannedAt: "",
        adminNote: "",
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create trade plan.");
    } finally {
      setBusyKey(null);
    }
  }

  async function forceOpen(planId: number) {
    setError(null);
    setInfo(null);
    setBusyKey(`force-open-${planId}`);
    try {
      const res = await fetch(`/api/admin/elite-portfolios/${memberId}/force-open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          executedQuantity: state[`force-open-qty-${planId}`]
            ? Number(state[`force-open-qty-${planId}`])
            : null,
          executedPrice: state[`force-open-price-${planId}`]
            ? Number(state[`force-open-price-${planId}`])
            : null,
          executedAt: state[`force-open-date-${planId}`] || null,
          investorNote: state[`force-open-note-${planId}`] || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to force open trade plan.");
      }
      setInfo("Trade plan force opened successfully.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to force open trade plan.");
    } finally {
      setBusyKey(null);
    }
  }

  async function forceClose(positionId: number) {
    setError(null);
    setInfo(null);
    setBusyKey(`force-close-${positionId}`);
    try {
      const res = await fetch(`/api/admin/positions/${positionId}/force-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedQuantity: state[`qty-${positionId}`]
            ? Number(state[`qty-${positionId}`])
            : null,
          requestedExitPrice: state[`exit-${positionId}`]
            ? Number(state[`exit-${positionId}`])
            : null,
          requestNote: state[`note-${positionId}`] || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to force close position.");
      }
      setInfo("Position force closed successfully.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to force close position.");
    } finally {
      setBusyKey(null);
    }
  }

  async function sendMessage(planId: number) {
    setError(null);
    setBusyKey(`msg-${planId}`);
    try {
      const res = await fetch(`/api/admin/trade-plans/${planId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: state[`msg-${planId}`] || "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to send admin note.");
      setState((current) => ({ ...current, [`msg-${planId}`]: "" }));
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to send admin note.");
    } finally {
      setBusyKey(null);
    }
  }

  async function requestClose(positionId: number) {
    setError(null);
    setBusyKey(`close-${positionId}`);
    try {
      const res = await fetch(`/api/admin/positions/${positionId}/close-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedQuantity: Number(state[`qty-${positionId}`] || 0),
          requestedExitPrice: state[`exit-${positionId}`]
            ? Number(state[`exit-${positionId}`])
            : null,
          requestNote: state[`note-${positionId}`] || null,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to create close request.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create close request.");
    } finally {
      setBusyKey(null);
    }
  }

  async function respondClose(requestId: number, decision: "ACCEPTED" | "REJECTED") {
    setError(null);
    setBusyKey(`respond-${requestId}-${decision}`);
    try {
      const res = await fetch(`/api/admin/close-requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          responseNote: state[`reply-${requestId}`] || null,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          json?.message || "Failed to respond to close request.",
        );
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to respond to close request.");
    } finally {
      setBusyKey(null);
    }
  }

  async function requestPayout() {
    setError(null);
    setInfo(null);
    setBusyKey("request-payout");
    try {
      const res = await fetch(
        `/api/admin/elite-portfolios/${memberId}/payout-request`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to create payout request.");
      setInfo(json?.message || "Payout request placeholder created.");
    } catch (err: any) {
      setError(err.message || "Failed to create payout request.");
    } finally {
      setBusyKey(null);
    }
  }


  async function reviewFirmPayment(
    paymentId: number,
    decision: "APPROVE" | "REJECT",
  ) {
    setError(null);
    setInfo(null);
    setBusyKey(`${decision}-${paymentId}`);
    try {
      const res = await fetch(
        `/api/admin/firm-profit-payments/${paymentId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            reviewNote: state[`payment-review-${paymentId}`] || null,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to review payment.");
      setInfo(
        decision === "APPROVE"
          ? "Bank transfer approved as fully paid."
          : "Bank transfer rejected.",
      );
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to review payment.");
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) return <LoadingBlock label="Loading investor detail..." />;
  if (!data) return null;

  const summary = data.portfolio.summary;

  return (
    <div className="space-y-6">
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
        title={data.investorName}
        description={`${data.email} • ${data.phoneNumber}`}
        action={
          <Button
            type="button"
            variant="outline"
            disabled={busyKey === "request-payout"}
            onClick={requestPayout}
          >
            {busyKey === "request-payout"
              ? "Saving..."
              : "Request payout"}
          </Button>
        }
      >
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <div className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700">
            Free capital: {money(summary.freeCapitalAmount)}
          </div>
          <div className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700">
            Money in market: {money(summary.moneyInMarket)}
          </div>
          <div className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700">
            Total equity: {money(summary.totalEquity)}
          </div>
          <div className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700">
            Partner: {data.partnerName || "None"}
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            Firm paid: {money(summary.firmProfitPaid)}
          </div>
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
            Remaining firm due: {money(summary.firmProfitOutstanding)}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Portfolio summary"
        description="This strips out the noise and shows the numbers that actually matter."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Free capital
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {money(summary.freeCapitalAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Money in market
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {money(summary.moneyInMarket)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Overall profit
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {money(summary.overallProfit)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Firm profit
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {money(summary.firmProfit)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Investor profit
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {money(summary.investorProfit)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">
              Firm paid
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-900">
              {money(summary.firmProfitPaid)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">
              Firm due
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">
              {money(summary.firmProfitOutstanding)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Unrealized
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {money(summary.openUnrealizedProfit)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Firm profit payments"
        description="Stripe and bank-transfer payments are listed here. Manual bank transfers must be approved only after the full current due amount reaches the bank."
      >
        {data.portfolio.firmPayments.length === 0 ? (
          <p className="text-sm text-slate-500">No firm profit payments yet.</p>
        ) : (
          <div className="space-y-4">
            {data.portfolio.firmPayments.map((payment: any) => {
              const method = String(payment.paymentMethod || "STRIPE").toUpperCase();
              const canReview =
                method === "BANK_TRANSFER" &&
                ["PROOF_SUBMITTED", "UNDER_REVIEW"].includes(
                  String(payment.status || "").toUpperCase(),
                );

              return (
                <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={payment.status} />
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                          {method.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Requested {money(payment.amountRequested)} • Paid {money(payment.amountPaid)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Created {shortDate(payment.createdAt)} • Paid at {payment.paidAt ? shortDate(payment.paidAt) : "—"}
                      </p>
                    </div>
                    {payment.proofUrl ? (
                      <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 underline">
                        Open transfer proof
                      </a>
                    ) : null}
                  </div>

                  {method === "BANK_TRANSFER" ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p><span className="font-semibold">Manual reference:</span> {payment.manualReference || "—"}</p>
                        <p><span className="font-semibold">Transfer reference:</span> {payment.transferReference || "—"}</p>
                        <p><span className="font-semibold">Bank:</span> {payment.bankName || "—"}</p>
                        <p className="font-mono break-all"><span className="font-sans font-semibold">IBAN:</span> {payment.iban || "—"}</p>
                        {payment.reviewNote ? <p className="mt-2 text-xs text-slate-500">Last note: {payment.reviewNote}</p> : null}
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <Textarea
                          placeholder="Admin review note"
                          value={state[`payment-review-${payment.id}`] || ""}
                          onChange={(e) =>
                            setState((current) => ({
                              ...current,
                              [`payment-review-${payment.id}`]: e.target.value,
                            }))
                          }
                        />
                        {canReview ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              disabled={busyKey === `APPROVE-${payment.id}`}
                              onClick={() => reviewFirmPayment(payment.id, "APPROVE")}
                            >
                              {busyKey === `APPROVE-${payment.id}` ? "Approving..." : "Approve as fully paid"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={busyKey === `REJECT-${payment.id}`}
                              onClick={() => reviewFirmPayment(payment.id, "REJECT")}
                            >
                              {busyKey === `REJECT-${payment.id}` ? "Rejecting..." : "Reject"}
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-500">No manual review action for this status.</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Create trade plan"
        description="One row equals one operation. Keep it sharp and specific."
      >
        <form className="grid gap-3 lg:grid-cols-3" onSubmit={createPlan}>
          <Input
            placeholder="Symbol"
            value={planForm.symbol}
            onChange={(e) =>
              setPlanForm({ ...planForm, symbol: e.target.value })
            }
          />
          <Input
            placeholder="Company name"
            value={planForm.companyName}
            onChange={(e) =>
              setPlanForm({ ...planForm, companyName: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Reference market price"
            value={planForm.referenceMarketPrice}
            onChange={(e) =>
              setPlanForm({ ...planForm, referenceMarketPrice: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Target entry price"
            value={planForm.targetEntryPrice}
            onChange={(e) =>
              setPlanForm({ ...planForm, targetEntryPrice: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Target 1"
            value={planForm.targetPrice1}
            onChange={(e) =>
              setPlanForm({ ...planForm, targetPrice1: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Target 2"
            value={planForm.targetPrice2}
            onChange={(e) =>
              setPlanForm({ ...planForm, targetPrice2: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Stop loss"
            value={planForm.stopLossPrice}
            onChange={(e) =>
              setPlanForm({ ...planForm, stopLossPrice: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Suggested quantity"
            value={planForm.suggestedQuantity}
            onChange={(e) =>
              setPlanForm({ ...planForm, suggestedQuantity: e.target.value })
            }
          />
          <Input
            type="datetime-local"
            placeholder="Planned at"
            value={planForm.plannedAt}
            onChange={(e) =>
              setPlanForm({ ...planForm, plannedAt: e.target.value })
            }
          />
          <div className="lg:col-span-3">
            <Textarea
              placeholder="Admin note"
              value={planForm.adminNote}
              onChange={(e) =>
                setPlanForm({ ...planForm, adminNote: e.target.value })
              }
            />
          </div>
          <Button type="submit" disabled={busyKey === "create-plan"}>
            {busyKey === "create-plan" ? "Saving..." : "Create plan"}
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="Trade plans and notes"
        description="Opening evidence is shown directly so the admin can inspect it instead of guessing."
      >
        <div className="space-y-5">
          {data.plans.map((plan: any) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.symbol}
                </h3>
                <StatusBadge status={plan.status} />
                <StatusBadge status={plan.investorDecision} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Qty {plan.suggestedQuantity} • Entry {money(plan.targetEntryPrice)} •{" "}
                {shortDate(plan.plannedAt)}
              </p>
              {plan.execution ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p>
                    Executed {plan.execution.executedQuantity} at{" "}
                    {money(plan.execution.executedPrice)} on{" "}
                    {shortDate(plan.execution.executedAt)}.
                  </p>
                  {plan.execution.investorNote ? (
                    <p className="mt-2 text-emerald-900">
                      Note: {plan.execution.investorNote}
                    </p>
                  ) : null}
                  {plan.execution.screenshotUrl ? (
                    <div className="mt-3 space-y-2">
                      <a
                        href={plan.execution.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold underline"
                      >
                        Open execution evidence
                      </a>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={plan.execution.screenshotUrl}
                        alt={plan.execution.screenshotName || "Execution evidence"}
                        className="max-h-64 rounded-xl border border-emerald-200 object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!plan.execution && !["EXECUTED", "CANCELLED", "CLOSED"].includes(String(plan.status || "").toUpperCase()) ? (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Admin force open</p>
                      <p className="text-xs text-blue-700">Open the plan directly without waiting for investor execution submission.</p>
                    </div>
                    <Button
                      type="button"
                      className="bg-blue-700 hover:bg-blue-800"
                      disabled={busyKey === `force-open-${plan.id}`}
                      onClick={() => forceOpen(plan.id)}
                    >
                      {busyKey === `force-open-${plan.id}` ? "Saving..." : "Force open now"}
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-4">
                    <Input
                      type="number"
                      placeholder={`Qty (${plan.suggestedQuantity})`}
                      value={state[`force-open-qty-${plan.id}`] || ""}
                      onChange={(e) =>
                        setState((current) => ({
                          ...current,
                          [`force-open-qty-${plan.id}`]: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder={`Price (${plan.targetEntryPrice || plan.referenceMarketPrice || 0})`}
                      value={state[`force-open-price-${plan.id}`] || ""}
                      onChange={(e) =>
                        setState((current) => ({
                          ...current,
                          [`force-open-price-${plan.id}`]: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="datetime-local"
                      value={state[`force-open-date-${plan.id}`] || ""}
                      onChange={(e) =>
                        setState((current) => ({
                          ...current,
                          [`force-open-date-${plan.id}`]: e.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Optional force-open note"
                      value={state[`force-open-note-${plan.id}`] || ""}
                      onChange={(e) =>
                        setState((current) => ({
                          ...current,
                          [`force-open-note-${plan.id}`]: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {plan.messages.length === 0 ? (
                    <p className="text-sm text-slate-500">No notes yet.</p>
                  ) : (
                    plan.messages.map((message: any) => (
                      <div
                        key={message.id}
                        className="rounded-xl bg-white p-3 text-sm text-slate-700"
                      >
                        <p className="font-semibold text-slate-900">
                          {message.senderRole}
                        </p>
                        <p>{message.messageText}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {shortDate(message.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Admin note to investor"
                    value={state[`msg-${plan.id}`] || ""}
                    onChange={(e) =>
                      setState((current) => ({
                        ...current,
                        [`msg-${plan.id}`]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyKey === `msg-${plan.id}`}
                    onClick={() => sendMessage(plan.id)}
                  >
                    {busyKey === `msg-${plan.id}`
                      ? "Sending..."
                      : "Send note"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Open positions"
        description="The current column is now explicit and the close flow stays visible."
      >
        {data.portfolio.openPositions.length === 0 ? (
          <p className="text-sm text-slate-500">No open positions yet.</p>
        ) : (
          <div className="space-y-5">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Symbol</th>
                    <th className="px-4 py-3 font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold">Entry</th>
                    <th className="px-4 py-3 font-semibold">Current</th>
                    <th className="px-4 py-3 font-semibold">Invested</th>
                    <th className="px-4 py-3 font-semibold">Market value</th>
                    <th className="px-4 py-3 font-semibold">Unrealized</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {data.portfolio.openPositions.map((position: any) => (
                    <tr key={position.id}>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {position.symbol}
                      </td>
                      <td className="px-4 py-4">{position.quantityOpen}</td>
                      <td className="px-4 py-4">{money(position.entryPrice)}</td>
                      <td className="px-4 py-4">{money(position.currentPrice)}</td>
                      <td className="px-4 py-4">
                        {money(position.investedAmount)}
                      </td>
                      <td className="px-4 py-4">
                        {money(position.marketValue)}
                      </td>
                      <td className="px-4 py-4">
                        {money(position.unrealizedProfit)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={position.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.portfolio.openPositions.map((position: any) => (
              <div
                key={`position-form-${position.id}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {position.symbol}
                  </h3>
                  <StatusBadge status={position.status} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Qty {position.quantityOpen} • Entry {money(position.entryPrice)} •
                  Current {money(position.currentPrice)}
                </p>
                <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-4">
                  <Input
                    type="number"
                    placeholder="Close quantity"
                    value={state[`qty-${position.id}`] || ""}
                    onChange={(e) =>
                      setState((current) => ({
                        ...current,
                        [`qty-${position.id}`]: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Requested exit price"
                    value={state[`exit-${position.id}`] || ""}
                    onChange={(e) =>
                      setState((current) => ({
                        ...current,
                        [`exit-${position.id}`]: e.target.value,
                      }))
                    }
                  />
                  <Textarea
                    className="lg:col-span-2"
                    placeholder="Admin close note"
                    value={state[`note-${position.id}`] || ""}
                    onChange={(e) =>
                      setState((current) => ({
                        ...current,
                        [`note-${position.id}`]: e.target.value,
                      }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busyKey === `close-${position.id}`}
                      onClick={() => requestClose(position.id)}
                    >
                      {busyKey === `close-${position.id}`
                        ? "Saving..."
                        : "Request investor approval"}
                    </Button>
                    <Button
                      type="button"
                      className="bg-blue-700 hover:bg-blue-800"
                      disabled={busyKey === `force-close-${position.id}`}
                      onClick={() => forceClose(position.id)}
                    >
                      {busyKey === `force-close-${position.id}`
                        ? "Saving..."
                        : "Force close now"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {data.portfolio.closeRequests.map((request: any) =>
              request.status === "PENDING" &&
              request.initiatedByRole === "INVESTOR" ? (
                <div
                  key={request.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={request.status} />
                        <div className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                          Investor requested close
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-amber-900">
                        Position #{request.positionId} • Qty {request.requestedQuantity} •
                        Requested exit{" "}
                        {request.requestedExitPrice == null
                          ? "Market/none"
                          : money(request.requestedExitPrice)}
                      </p>
                      {request.requestNote ? (
                        <p className="mt-2 text-sm text-amber-800">
                          {request.requestNote}
                        </p>
                      ) : null}
                      {request.evidenceUrl ? (
                        <div className="mt-3 space-y-2">
                          <a
                            href={request.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-amber-800 underline"
                          >
                            Open closing evidence
                          </a>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={request.evidenceUrl}
                            alt={request.evidenceName || "Close evidence"}
                            className="max-h-64 rounded-xl border border-amber-200 object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Admin response note"
                        value={state[`reply-${request.id}`] || ""}
                        onChange={(e) =>
                          setState((current) => ({
                            ...current,
                            [`reply-${request.id}`]: e.target.value,
                          }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          disabled={busyKey === `respond-${request.id}-ACCEPTED`}
                          onClick={() => respondClose(request.id, "ACCEPTED")}
                        >
                          {busyKey === `respond-${request.id}-ACCEPTED`
                            ? "Saving..."
                            : "Approve close"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busyKey === `respond-${request.id}-REJECTED`}
                          onClick={() => respondClose(request.id, "REJECTED")}
                        >
                          {busyKey === `respond-${request.id}-REJECTED`
                            ? "Saving..."
                            : "Reject"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Closure history"
        description="Closing evidence and net profit are shown directly."
      >
        {data.portfolio.closures.length === 0 ? (
          <p className="text-sm text-slate-500">No closures recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Symbol</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Exit</th>
                  <th className="px-4 py-3 font-semibold">Overall profit</th>
                  <th className="px-4 py-3 font-semibold">Firm profit</th>
                  <th className="px-4 py-3 font-semibold">Firm paid</th>
                  <th className="px-4 py-3 font-semibold">Investor profit</th>
                  <th className="px-4 py-3 font-semibold">Evidence</th>
                  <th className="px-4 py-3 font-semibold">Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.portfolio.closures.map((closure: any) => {
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
                      <td className="px-4 py-4">{money(closure.exitPrice)}</td>
                      <td className="px-4 py-4">
                        {money(closure.realizedProfitAmount)}
                      </td>
                      <td className="px-4 py-4">
                        {money(closure.firmShareAmount)}
                      </td>
                      <td className="px-4 py-4">
                        {money(closure.firmPaidAmount || 0)}
                      </td>
                      <td className="px-4 py-4">{money(investorNet)}</td>
                      <td className="px-4 py-4">
                        {closure.evidenceUrl ? (
                          <div className="space-y-2">
                            <a
                              href={closure.evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-blue-700 underline"
                            >
                              Open image
                            </a>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={closure.evidenceUrl}
                              alt={closure.evidenceName || "Close evidence"}
                              className="max-h-24 rounded-xl border border-slate-200 object-cover"
                            />
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4">{shortDate(closure.closedAt)}</td>
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
