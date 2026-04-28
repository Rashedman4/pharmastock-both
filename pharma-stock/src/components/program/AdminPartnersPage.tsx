"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBlock, SectionCard, StatusBadge, money } from "@/components/program/shared";

interface PartnerRow {
  id: number;
  status: string;
  displayName: string;
  phoneNumber: string;
  bio: string;
  referralCode?: string | null;
  createdAt: string;
  ownerName: string;
  email: string;
  investorsCount: number;
  partnerShare: number;
}

export default function AdminPartnersPage() {
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/partners', { cache: 'no-store' });
        const json = await res.json();
        setRows(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingBlock label="Loading partners..." />;

  return (
    <SectionCard title="Partners" description="Review partner applications, inspect referral details, and open the linked investor list.">
      <div className="space-y-4">
        {rows.map((partner) => (
          <div key={partner.id} className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{partner.displayName}</h3>
                  <StatusBadge status={partner.status} />
                </div>
                <p className="text-sm text-slate-500">Owner: {partner.ownerName} • {partner.email}</p>
                <p className="text-sm text-slate-600">{partner.phoneNumber}</p>
                <p className="max-w-3xl text-sm text-slate-600">{partner.bio}</p>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>Investors: {partner.investorsCount}</span>
                  <span>Current partner due: {money(partner.partnerShare)}</span>
                  <span>Referral code: {partner.referralCode || 'Not approved yet'}</span>
                </div>
              </div>
              <Button asChild variant="outline"><Link href={`/admin/partners/${partner.id}`}>Open partner</Link></Button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
