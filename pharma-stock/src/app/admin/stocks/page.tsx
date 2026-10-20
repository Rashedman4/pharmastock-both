"use client";

import type React from "react";
import { useState } from "react";
import useSWR from "swr";
import { PlusCircle, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/adminPagination";
import type { PaginationMeta } from "@/lib/mobile/paginate";

interface StockRow {
  symbol: string;
  name_en: string;
  name_ar: string | null;
  is_active: boolean;
}

interface StocksResponse {
  data: StockRow[];
  pagination: PaginationMeta;
}

const fetchStocks = async (url: string): Promise<StocksResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch stocks");
  return res.json();
};

const emptyDraft = { symbol: "", name_en: "", name_ar: "" };

export default function StocksManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<StockRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams({ page: String(page), limit: "50" });
  if (search.trim()) query.set("search", search.trim());

  const { data, mutate, isLoading } = useSWR<StocksResponse>(
    `/api/admin/stocks?${query.toString()}`,
    fetchStocks
  );

  const readError = async (res: Response, fallback: string) => {
    const payload = await res.json().catch(() => null);
    const issues = payload?.issues as { message: string }[] | undefined;
    return issues?.length
      ? issues.map((i) => i.message).join(", ")
      : payload?.error || fallback;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: draft.symbol,
          name_en: draft.name_en,
          name_ar: draft.name_ar || null,
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Failed to add stock"));
      setDraft(emptyDraft);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/stocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: editing.symbol,
          name_en: editing.name_en,
          name_ar: editing.name_ar || null,
          is_active: editing.is_active,
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Failed to update stock"));
      setEditing(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-royalBlue">Covered Stocks</h1>
        <p className="mt-1 text-sm text-gray-600">
          Stock search and watchlists only ever show symbols from this list. New
          symbols are added automatically whenever you publish news, a
          breakthrough, a daily update or an announcement — fix their names here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Add Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label
                htmlFor="symbol"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Symbol
              </label>
              <Input
                id="symbol"
                value={draft.symbol}
                onChange={(e) =>
                  setDraft({ ...draft, symbol: e.target.value.toUpperCase() })
                }
                placeholder="MRNA"
                required
              />
            </div>
            <div>
              <label
                htmlFor="name_en"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                English Name
              </label>
              <Input
                id="name_en"
                value={draft.name_en}
                onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                placeholder="Moderna, Inc."
                required
              />
            </div>
            <div>
              <label
                htmlFor="name_ar"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Arabic Name (optional)
              </label>
              <Input
                id="name_ar"
                value={draft.name_ar}
                onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
                placeholder="موديرنا"
                dir="rtl"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="bg-brightTeal text-pureWhite hover:bg-brightTeal/90"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Stock
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Stock Universe
          </CardTitle>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search symbol or name"
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>English Name</TableHead>
                  <TableHead>Arabic Name</TableHead>
                  <TableHead>Searchable</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((stock) =>
                  editing?.symbol === stock.symbol ? (
                    <TableRow key={stock.symbol}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>
                        <Input
                          value={editing.name_en}
                          onChange={(e) =>
                            setEditing({ ...editing, name_en: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          dir="rtl"
                          value={editing.name_ar ?? ""}
                          onChange={(e) =>
                            setEditing({ ...editing, name_ar: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={editing.is_active}
                            onChange={(e) =>
                              setEditing({ ...editing, is_active: e.target.checked })
                            }
                          />
                          Active
                        </label>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditing(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={stock.symbol}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>{stock.name_en}</TableCell>
                      <TableCell dir="rtl">{stock.name_ar || "—"}</TableCell>
                      <TableCell>
                        {stock.is_active ? (
                          <span className="text-emerald-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">Hidden</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => setEditing(stock)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
                {!isLoading && data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No stocks match that search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {data?.pagination && (
            <AdminPagination pagination={data.pagination} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
