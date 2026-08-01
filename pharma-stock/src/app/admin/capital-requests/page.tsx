"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard, StatusBadge, money, shortDate } from "@/components/program/shared";

interface CapitalChangeRequest {
  id: number;
  eliteMemberId: number;
  portfolioId: number;
  investorUserId: number;
  investorName: string;
  investorEmail: string;
  currentCapitalAmount: number;
  requestedCapitalAmount: number;
  requestNote?: string | null;
  status: string;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

const filters = ["PENDING", "ALL", "APPROVED", "REJECTED"];

export default function AdminCapitalRequestsPage() {
  const [requests, setRequests] = useState<CapitalChangeRequest[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [state, setState] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/admin/capital-requests?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load capital change requests.");
      setRequests(json);
    } catch (err: any) {
      setError(err.message || "Failed to load capital change requests.");
    }
  }, [status]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function review(requestId: number, decision: "APPROVED" | "REJECTED") {
    setError(null);
    setInfo(null);
    setBusyKey(`${decision}-${requestId}`);
    try {
      const res = await fetch(`/api/admin/capital-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          reviewNote: state[`note-${requestId}`] || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to review request.");
      setInfo(decision === "APPROVED" ? "Capital change approved." : "Capital change rejected.");
      setState((current) => ({ ...current, [`note-${requestId}`]: "" }));
      await loadRequests();
    } catch (err: any) {
      setError(err.message || "Failed to review request.");
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
        title="Capital change requests"
        description="Investors submit a request when they want to change their Elite portfolio's free capital. Approving here is the only way the amount actually changes."
      >
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item}
              type="button"
              variant={status === item ? "default" : "outline"}
              onClick={() => setStatus(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </SectionCard>

      {requests.length === 0 ? (
        <SectionCard title="No requests found">
          <p className="text-sm text-slate-500">No capital change requests match this filter.</p>
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const canReview = String(req.status).toUpperCase() === "PENDING";
            return (
              <SectionCard
                key={req.id}
                title={`${req.investorName} — ${money(req.currentCapitalAmount)} → ${money(req.requestedCapitalAmount)}`}
                description={`${req.investorEmail} • Requested ${shortDate(req.createdAt)}`}
                action={<StatusBadge status={req.status} />}
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p><span className="font-semibold">Current capital:</span> {money(req.currentCapitalAmount)}</p>
                    <p><span className="font-semibold">Requested capital:</span> {money(req.requestedCapitalAmount)}</p>
                    <Link className="mt-2 inline-block text-blue-700 underline" href={`/admin/elite-portfolios/${req.eliteMemberId}`}>
                      Open investor
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p><span className="font-semibold">Investor note:</span> {req.requestNote || "—"}</p>
                    {req.reviewNote ? (
                      <p className="mt-2"><span className="font-semibold">Last review note:</span> {req.reviewNote}</p>
                    ) : null}
                    {req.reviewedAt ? (
                      <p className="mt-2 text-xs text-slate-500">Reviewed {shortDate(req.reviewedAt)}</p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <Textarea
                      placeholder="Admin review note"
                      value={state[`note-${req.id}`] || ""}
                      onChange={(e) =>
                        setState((current) => ({
                          ...current,
                          [`note-${req.id}`]: e.target.value,
                        }))
                      }
                    />
                    {canReview ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={busyKey === `APPROVED-${req.id}`}
                          onClick={() => review(req.id, "APPROVED")}
                        >
                          {busyKey === `APPROVED-${req.id}` ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busyKey === `REJECTED-${req.id}`}
                          onClick={() => review(req.id, "REJECTED")}
                        >
                          {busyKey === `REJECTED-${req.id}` ? "Rejecting..." : "Reject"}
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
