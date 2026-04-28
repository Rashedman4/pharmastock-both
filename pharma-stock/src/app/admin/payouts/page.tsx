"use client";

import { useEffect, useState } from "react";

interface PayoutItem {
  agentId: number;
  amount: number;
  status: string;
}
interface PayoutBatch {
  id: number;
  createdAt: string;
  status: string;
  totalAmount: number;
  items: PayoutItem[];
}

export default function AdminPayoutsPage() {
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/payouts", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch payouts");
        const json = await res.json();
        setBatches(json);
      } catch (err: any) {
        setError(err.message || "Failed to load payouts");
      }
    }
    fetchData();
  }, []);
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Payout Batches</h1>
      {batches.map((batch) => (
        <div key={batch.id} className="border p-4 rounded mb-4">
          <h2 className="font-medium">Batch #{batch.id}</h2>
          <p>Created: {batch.createdAt}</p>
          <p>Status: {batch.status}</p>
          <p>Total Amount: ${batch.totalAmount.toLocaleString()}</p>
          <h3 className="font-medium mt-2">Items</h3>
          <ul className="list-disc pl-5">
            {batch.items.map((item, idx) => (
              <li key={idx}>
                Agent {item.agentId}: ${item.amount.toLocaleString()} – {item.status}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}