"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard, StatusBadge, shortDate } from "@/components/program/shared";

interface FirmBankAccount {
  id: number;
  accountName: string;
  bankName: string;
  iban: string;
  swiftCode?: string | null;
  currency: string;
  country?: string | null;
  instructions?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  id: "",
  accountName: "",
  bankName: "",
  iban: "",
  swiftCode: "",
  currency: "USD",
  country: "",
  instructions: "",
};

export default function AdminBankSettingsPage() {
  const [accounts, setAccounts] = useState<FirmBankAccount[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/firm-bank-accounts", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load bank accounts.");
      setAccounts(json);
      const active = json.find((item: FirmBankAccount) => item.isActive) || json[0];
      if (active) {
        setForm({
          id: String(active.id),
          accountName: active.accountName || "",
          bankName: active.bankName || "",
          iban: active.iban || "",
          swiftCode: active.swiftCode || "",
          currency: active.currency || "USD",
          country: active.country || "",
          instructions: active.instructions || "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load bank accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  async function saveBankAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/firm-bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id ? Number(form.id) : null,
          accountName: form.accountName,
          bankName: form.bankName,
          iban: form.iban,
          swiftCode: form.swiftCode || null,
          currency: form.currency || "USD",
          country: form.country || null,
          instructions: form.instructions || null,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to save bank account.");
      setInfo("Firm bank account saved and activated.");
      await loadAccounts();
    } catch (err: any) {
      setError(err.message || "Failed to save bank account.");
    } finally {
      setBusy(false);
    }
  }

  function editAccount(account: FirmBankAccount) {
    setForm({
      id: String(account.id),
      accountName: account.accountName || "",
      bankName: account.bankName || "",
      iban: account.iban || "",
      swiftCode: account.swiftCode || "",
      currency: account.currency || "USD",
      country: account.country || "",
      instructions: account.instructions || "",
    });
    setInfo(null);
    setError(null);
  }

  function clearForm() {
    setForm(emptyForm);
    setInfo(null);
    setError(null);
  }

  if (loading) return <div className="text-sm text-slate-500">Loading bank settings...</div>;

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
        title="Firm bank information"
        description="This is the active IBAN shown to Elite investors when they choose bank-transfer profit payment. Keep it exact. Bad bank data means failed money movement."
        action={
          <Button type="button" variant="outline" onClick={clearForm}>
            Add new account
          </Button>
        }
      >
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={saveBankAccount}>
          <Input
            placeholder="Beneficiary / account name"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
            required
          />
          <Input
            placeholder="Bank name"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            required
          />
          <Input
            placeholder="IBAN"
            value={form.iban}
            onChange={(e) => setForm({ ...form, iban: e.target.value })}
            required
          />
          <Input
            placeholder="SWIFT / BIC optional"
            value={form.swiftCode}
            onChange={(e) => setForm({ ...form, swiftCode: e.target.value })}
          />
          <Input
            placeholder="Currency"
            value={form.currency}
            maxLength={3}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
            required
          />
          <Input
            placeholder="Country optional"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <div className="lg:col-span-2">
            <Textarea
              placeholder="Extra transfer instructions shown to investors"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>
          <div className="lg:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : form.id ? "Update active bank account" : "Save active bank account"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Saved firm bank accounts"
        description="Only one account is active at a time. The active one is used in investor bank-transfer requests."
      >
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-500">No bank accounts configured yet.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{account.accountName}</p>
                    <p className="text-sm text-slate-500">{account.bankName}</p>
                  </div>
                  <StatusBadge status={account.isActive ? "ACTIVE" : "INACTIVE"} />
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p className="font-mono break-all">{account.iban}</p>
                  <p>{account.currency} {account.swiftCode ? `• ${account.swiftCode}` : ""}</p>
                  <p>Updated {shortDate(account.updatedAt)}</p>
                </div>
                <Button type="button" variant="outline" className="mt-4" onClick={() => editAccount(account)}>
                  Edit / activate
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
