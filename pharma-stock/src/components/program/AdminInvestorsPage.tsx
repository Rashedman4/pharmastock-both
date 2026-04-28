"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LoadingBlock,
  SectionCard,
  StatusBadge,
  money,
} from "@/components/program/shared";

interface InvestorRow {
  applicationId?: number | null;
  sourceType?: string;
  applicationStatus: string;
  phoneNumber: string;
  investmentAmount: number;
  appliedAt: string;
  memberId?: number | null;
  memberStatus?: string | null;
  currentCapital: number;
  investorName: string;
  email: string;
  partnerId?: number | null;
  partnerName?: string | null;
}

interface CandidateUser {
  id: number;
  displayName: string;
  email: string;
  phoneNumber?: string | null;
}
interface PartnerOption {
  id: number;
  displayName: string;
  referralCode?: string | null;
  email: string;
}
export default function AdminInvestorsPage() {
  const [rows, setRows] = useState<InvestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualUsers, setManualUsers] = useState<CandidateUser[]>([]);
  const [manualQuery, setManualQuery] = useState("");
  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [manualForm, setManualForm] = useState({
    userId: "",
    currentCapitalAmount: "100000",
    note: "",
    partnerAccountId: "",
  });
  const [creatingManual, setCreatingManual] = useState(false);

  async function loadData() {
    try {
      const res = await fetch("/api/admin/elite-applications", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to load investors.");
      setRows(Array.isArray(json) ? json : []);
    } catch (err: any) {
      setError(err.message || "Failed to load investors.");
    } finally {
      setLoading(false);
    }
  }

  async function loadManualUsers(query?: string) {
    try {
      const params = new URLSearchParams();
      if (query?.trim()) params.set("query", query.trim());
      const res = await fetch(
        `/api/admin/manual-elite-members${params.toString() ? `?${params.toString()}` : ""}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load users.");
      setManualUsers(Array.isArray(json) ? json : []);
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    }
  }

  useEffect(() => {
    loadData();
    loadManualUsers();
    loadPartnerOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadManualUsers(manualQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [manualQuery]);
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPartnerOptions(partnerQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [partnerQuery]);

  async function loadPartnerOptions(query?: string) {
    try {
      const params = new URLSearchParams();
      if (query?.trim()) params.set("query", query.trim());

      const res = await fetch(
        `/api/admin/manual-elite-members/partners${params.toString() ? `?${params.toString()}` : ""}`,
        { cache: "no-store" },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load partners.");
      setPartnerOptions(Array.isArray(json) ? json : []);
    } catch (err: any) {
      setError(err.message || "Failed to load partners.");
    }
  }
  async function review(applicationId: number, approve: boolean) {
    try {
      const res = await fetch("/api/admin/elite-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, approve }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to review investor.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to review investor.");
    }
  }

  async function createManualEliteMember(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCreatingManual(true);
    try {
      const res = await fetch("/api/admin/manual-elite-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(manualForm.userId || 0),
          currentCapitalAmount: Number(manualForm.currentCapitalAmount || 0),
          note: manualForm.note || null,
          partnerAccountId: manualForm.partnerAccountId
            ? Number(manualForm.partnerAccountId)
            : null,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          json?.message || "Failed to create manual Elite member.",
        );
      setManualForm({
        userId: "",
        currentCapitalAmount: "100000",
        note: "",
        partnerAccountId: "",
      });
      await loadData();
      await loadManualUsers(manualQuery);
    } catch (err: any) {
      setError(err.message || "Failed to create manual Elite member.");
    } finally {
      setCreatingManual(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading investors..." />;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Create Elite member manually"
        description="Choose a user directly from the users table, then create the Elite member, portfolio, and starting capital in one step."
      >
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <form
          className="grid gap-4 lg:grid-cols-2"
          onSubmit={createManualEliteMember}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Search users
            </label>
            <Input
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Choose user
            </label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={manualForm.userId}
              onChange={(e) =>
                setManualForm((current) => ({
                  ...current,
                  userId: e.target.value,
                }))
              }
            >
              <option value="">Select user</option>
              {manualUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} • {user.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Search partners
            </label>
            <Input
              value={partnerQuery}
              onChange={(e) => setPartnerQuery(e.target.value)}
              placeholder="Search by partner name, email, or referral code"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Attach to partner
            </label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={manualForm.partnerAccountId}
              onChange={(e) =>
                setManualForm((current) => ({
                  ...current,
                  partnerAccountId: e.target.value,
                }))
              }
            >
              <option value="">No partner</option>
              {partnerOptions.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.displayName} • {partner.email}
                  {partner.referralCode ? ` • ${partner.referralCode}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Starting capital
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={manualForm.currentCapitalAmount}
              onChange={(e) =>
                setManualForm((current) => ({
                  ...current,
                  currentCapitalAmount: e.target.value,
                }))
              }
              placeholder="100000"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Optional note
            </label>
            <Input
              value={manualForm.note}
              onChange={(e) =>
                setManualForm((current) => ({
                  ...current,
                  note: e.target.value,
                }))
              }
              placeholder="Visible in the activity log"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800"
              disabled={creatingManual || !manualForm.userId}
            >
              {creatingManual ? "Creating..." : "Create member + portfolio"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Elite investors"
        description="Approve applications, inspect partner attribution, and open the investor management page."
      >
        <div className="space-y-4">
          {rows.map((row) => (
            <div
              key={`${row.sourceType || "ROW"}-${row.applicationId ?? row.memberId ?? row.email}`}
              className="rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {row.investorName}
                    </h3>
                    <StatusBadge status={row.applicationStatus} />
                    {row.memberStatus ? (
                      <StatusBadge status={row.memberStatus} />
                    ) : null}
                    {row.sourceType === "MANUAL" ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Manual member
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-500">
                    {row.email} • {row.phoneNumber || "No phone"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span>Review capital: {money(row.investmentAmount)}</span>
                    <span>Current capital: {money(row.currentCapital)}</span>
                    <span>Partner: {row.partnerName || "None"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.applicationStatus === "PENDING" && row.applicationId ? (
                    <>
                      <Button
                        type="button"
                        onClick={() =>
                          review(row.applicationId as number, true)
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          review(row.applicationId as number, false)
                        }
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {row.memberId ? (
                    <Button asChild variant="outline">
                      <Link href={`/admin/elite-portfolios/${row.memberId}`}>
                        Manage investor
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
