"use client";

import { useEffect, useState } from 'react';
import { LoadingBlock, SectionCard, StatusBadge, shortDate } from '@/components/program/shared';

export default function AdminReferralsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/referrals', { cache: 'no-store' });
        const json = await res.json();
        setRows(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) return <LoadingBlock label="Loading referral links..." />;
  return (
    <SectionCard title="Partner attribution links" description="Final partner → investor mapping only. Click analytics were intentionally removed from the core flow.">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={row.status} />
              <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">{row.referralCodeUsed || 'No code stored'}</div>
            </div>
            <p className="mt-2 font-semibold text-slate-900">{row.partnerName} → {row.investorName}</p>
            <p className="text-sm text-slate-500">{row.investorEmail} • linked {shortDate(row.linkedAt)}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
