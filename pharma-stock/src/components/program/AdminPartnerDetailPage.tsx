"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingBlock, SectionCard, StatusBadge, money } from "@/components/program/shared";

interface DetailData {
  id: number;
  status: string;
  displayName: string;
  phoneNumber: string;
  bio: string;
  iban?: string | null;
  referralCode?: string | null;
  reviewNote?: string | null;
  ownerName: string;
  email: string;
  payoutSummary?: { unlockedAmount: number; availableToRequestAmount: number; requestedLockedAmount: number; paidOutAmount: number };
  payoutRequests?: Array<{ id: number; requestedAmount: number; ibanSnapshot: string; status: string; createdAt: string; paidAt?: string | null }>;
  investors: Array<{ investorUserId: number; investorName: string; email: string; linkStatus: string; currentCapital: number; realizedProfit: number; partnerShare: number; firmProfitPaid: number; partnerUnlockedAmount: number; openPositions: number }>;
}

export default function AdminPartnerDetailPage({ partnerId }: { partnerId: number }) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to load partner.');
      setData(json);
      setReviewNote(json.reviewNote || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load partner.');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function review(approve: boolean) {
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, reviewNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to review partner.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to review partner.');
    }
  }

  if (loading) return <LoadingBlock label="Loading partner detail..." />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <SectionCard title={data.displayName} description={`${data.ownerName} • ${data.email}`}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={data.status} />
            <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Referral code: {data.referralCode || 'Not created yet'}</div>
            <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Phone: {data.phoneNumber}</div>
            <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">IBAN: {data.iban || 'Not provided yet'}</div>
          </div>
          <p className="text-sm text-slate-600">{data.bio}</p>
          <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Admin review note" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => review(true)}>Approve partner</Button>
            <Button type="button" variant="outline" onClick={() => review(false)}>Reject partner</Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Partner payout state" description="Unlocked means the investor already paid the firm's share for related closures.">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Unlocked</p><p className="mt-2 text-2xl font-semibold text-slate-900">{money(data.payoutSummary?.unlockedAmount || 0)}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Available</p><p className="mt-2 text-2xl font-semibold text-slate-900">{money(data.payoutSummary?.availableToRequestAmount || 0)}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Requested</p><p className="mt-2 text-2xl font-semibold text-slate-900">{money(data.payoutSummary?.requestedLockedAmount || 0)}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Paid out</p><p className="mt-2 text-2xl font-semibold text-slate-900">{money(data.payoutSummary?.paidOutAmount || 0)}</p></div>
        </div>
        <div className="mt-4 space-y-3">
          {(data.payoutRequests || []).length === 0 ? <p className="text-sm text-slate-500">No partner payout requests yet.</p> : data.payoutRequests?.map((request) => (
            <div key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{money(request.requestedAmount)}</p>
                  <p className="text-sm text-slate-500">IBAN {request.ibanSnapshot} • Requested {request.createdAt}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Linked investors" description="These are the investors attributed to this partner.">
        <div className="space-y-3">
          {data.investors.length === 0 ? <p className="text-sm text-slate-500">No linked investors yet.</p> : data.investors.map((investor) => (
            <div key={investor.investorUserId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{investor.investorName}</p>
                  <p className="text-sm text-slate-500">{investor.email}</p>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p>Capital {money(investor.currentCapital)}</p>
                  <p>Profit {money(investor.realizedProfit)}</p>
                  <p>Current partner due {money(investor.partnerShare)}</p>
                  <p>Firm paid {money(investor.firmProfitPaid)}</p>
                  <p>Unlocked share {money(investor.partnerUnlockedAmount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
