"use client";

import { useEffect, useState } from "react";

interface CommissionEntry {
  id: number;
  agentId: number;
  period: string;
  status: string;
  amount: number;
}

export default function AdminCommissionsPage() {
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/commissions", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch commissions");
        const json = await res.json();
        setEntries(json);
      } catch (err: any) {
        setError(err.message || "Failed to load commissions");
      }
    }
    fetchData();
  }, []);
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Commission Ledger</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b">
            <tr>
              <th className="px-2 py-1">ID</th>
              <th className="px-2 py-1">Agent ID</th>
              <th className="px-2 py-1">Period</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b">
                <td className="px-2 py-1">{entry.id}</td>
                <td className="px-2 py-1">{entry.agentId}</td>
                <td className="px-2 py-1">{entry.period}</td>
                <td className="px-2 py-1">{entry.status}</td>
                <td className="px-2 py-1">${entry.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}