"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard, StatusBadge, money, shortDate } from "@/components/program/shared";

interface FirmProfitPayment {
  id: number;
  eliteMemberId: number;
  investorName: string;
  investorEmail: string;
  amountRequested: number;
  amountPaid: number;
  currency: string;
  status: string;
  paymentMethod: string;
  manualReference?: string | null;
  transferReference?: string | null;
  proofUrl?: string | null;
  proofName?: string | null;
  reviewNote?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  bankAccountName?: string | null;
  bankName?: string | null;
  iban?: string | null;
}

const filters = [
  "ALL",
  "PROOF_SUBMITTED",
  "AWAITING_TRANSFER",
  "UNDER_REVIEW",
  "REJECTED",
  "PAID",
  "CHECKOUT_CREATED",
];

export default function AdminFirmProfitPaymentsPage() {
  const [payments, setPayments] = useState<FirmProfitPayment[]>([]);
  const [status, setStatus] = useState("ALL");
  const [state, setState] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/admin/firm-profit-payments?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load firm profit payments.");
      setPayments(json);
    } catch (err: any) {
      setError(err.message || "Failed to load firm profit payments.");
    }
  }, [status]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  async function reviewPayment(paymentId: number, decision: "APPROVE" | "REJECT") {
    setError(null);
    setInfo(null);
    setBusyKey(`${decision}-${paymentId}`);
    try {
      const res = await fetch(`/api/admin/firm-profit-payments/${paymentId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          reviewNote: state[`note-${paymentId}`] || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to review payment.");
      setInfo(decision === "APPROVE" ? "Bank transfer approved as fully paid." : "Bank transfer rejected.");
      setState((current) => ({ ...current, [`note-${paymentId}`]: "" }));
      await loadPayments();
    } catch (err: any) {
      setError(err.message || "Failed to review payment.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {info ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div>
      ) : null}

      <SectionCard
        title="Firm profit payments"
        description="Review bank-transfer proofs and monitor Stripe checkout payments. Bank transfers are approved only as the full current due amount."
      >
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item}
              type="button"
              variant={status === item ? "default" : "outline"}
              onClick={() => setStatus(item)}
            >
              {item.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </SectionCard>

      {payments.length === 0 ? (
        <SectionCard title="No payments found">
          <p className="text-sm text-slate-500">No firm profit payments match this filter.</p>
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const method = String(payment.paymentMethod || "STRIPE").toUpperCase();
            const canReview =
              method === "BANK_TRANSFER" &&
              ["PROOF_SUBMITTED", "UNDER_REVIEW"].includes(String(payment.status).toUpperCase());

            return (
              <SectionCard
                key={payment.id}
                title={`${payment.investorName} — ${money(payment.amountRequested)}`}
                description={`${payment.investorEmail} • Created ${shortDate(payment.createdAt)}`}
                action={<StatusBadge status={payment.status} />}
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p><span className="font-semibold">Method:</span> {method.replace(/_/g, " ")}</p>
                    <p><span className="font-semibold">Requested:</span> {money(payment.amountRequested)}</p>
                    <p><span className="font-semibold">Paid:</span> {money(payment.amountPaid)}</p>
                    <p><span className="font-semibold">Paid at:</span> {shortDate(payment.paidAt)}</p>
                    <Link className="mt-2 inline-block text-blue-700 underline" href={`/admin/elite-portfolios/${payment.eliteMemberId}`}>
                      Open investor
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p><span className="font-semibold">Manual reference:</span> {payment.manualReference || "—"}</p>
                    <p><span className="font-semibold">Transfer reference:</span> {payment.transferReference || "—"}</p>
                    <p><span className="font-semibold">Bank:</span> {payment.bankName || "—"}</p>
                    <p className="font-mono break-all"><span className="font-sans font-semibold">IBAN:</span> {payment.iban || "—"}</p>
                    {payment.proofUrl ? (
                      <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-blue-700 underline">
                        Open transfer proof
                      </a>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <Textarea
                      placeholder="Admin review note"
                      value={state[`note-${payment.id}`] || ""}
                      onChange={(e) =>
                        setState((current) => ({
                          ...current,
                          [`note-${payment.id}`]: e.target.value,
                        }))
                      }
                    />
                    {payment.reviewNote ? (
                      <p className="mt-2 text-xs text-slate-500">Last note: {payment.reviewNote}</p>
                    ) : null}
                    {canReview ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={busyKey === `APPROVE-${payment.id}`}
                          onClick={() => reviewPayment(payment.id, "APPROVE")}
                        >
                          {busyKey === `APPROVE-${payment.id}` ? "Approving..." : "Approve as fully paid"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busyKey === `REJECT-${payment.id}`}
                          onClick={() => reviewPayment(payment.id, "REJECT")}
                        >
                          {busyKey === `REJECT-${payment.id}` ? "Rejecting..." : "Reject"}
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">No review action is available for this status.</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
