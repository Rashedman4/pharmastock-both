"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssignExecutionPage({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [executedAt, setExecutedAt] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/elite-portfolios/${memberId}/assign-execution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          shares: Number(shares),
          price: Number(price),
          executedAt,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setSymbol("");
        setShares("");
        setPrice("");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || "Failed to assign execution");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign execution");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Assign Execution</h1>
      <p className="mb-4 text-sm text-gray-600">
        Assign a verified trade execution for elite member ID {memberId}.
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded border p-4">
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-600">{error}</div>}
        {success && (
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700">
            Execution assigned successfully.
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="symbol">
            Symbol
          </label>
          <input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            placeholder="NVDA"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="shares">
            Shares
          </label>
          <input
            id="shares"
            type="number"
            step="0.0001"
            min="0.0001"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="price">
            Price (USD)
          </label>
          <input
            id="price"
            type="number"
            step="0.0001"
            min="0.0001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="executedAt">
            Execution Time
          </label>
          <input
            id="executedAt"
            type="datetime-local"
            value={executedAt}
            onChange={(e) => setExecutedAt(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Assign Execution"}
          </button>
          <button
            type="button"
            className="px-3 py-1 border rounded"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
