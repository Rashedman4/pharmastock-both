"use client";

import type React from "react";

import { useState } from "react";
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
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import useSWR from "swr";
import { Textarea } from "@/components/ui/textarea";
import { EditDailyUpdateModal } from "@/components/admin/editDailyUpdate";

interface DailyUpdateItem {
  id: number;
  symbol: string;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  description_en: string;
  description_ar: string;
  published_date: string;
}

const fetchDailyUpdates = async (): Promise<DailyUpdateItem[]> => {
  const res = await fetch("/api/admin/daily-updates");
  if (!res.ok) throw new Error("Failed to fetch daily updates");
  const data = await res.json();
  return data;
};

export default function DailyUpdatesManagement() {
  const [newUpdate, setNewUpdate] = useState({
    symbol: "",
    subtitle: {
      en: "",
      ar: "",
    },
    description: {
      en: "",
      ar: "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [bulkUpdates, setBulkUpdates] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUpdate, setEditUpdate] = useState<DailyUpdateItem | null>(null);

  const { data: dailyUpdates, mutate } = useSWR<DailyUpdateItem[]>(
    "/api/admin/daily-updates",
    fetchDailyUpdates
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/admin/daily-updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUpdate),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add daily update");
      }

      // Reset form and refresh data
      setNewUpdate({
        symbol: "",
        subtitle: {
          en: "",
          ar: "",
        },
        description: {
          en: "",
          ar: "",
        },
      });
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/daily-updates`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete daily update");
      }

      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete daily update");
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let updatesArray;
      try {
        updatesArray = JSON.parse(bulkUpdates);
        if (!Array.isArray(updatesArray)) {
          throw new Error("Input must be an array of daily update items");
        }
      } catch (err) {
        console.log(err);
        throw new Error("Invalid JSON format");
      }

      const res = await fetch("/api/admin/daily-updates/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bulkUpdates,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add daily updates");
      }

      // Reset form and refresh data
      setBulkUpdates("");
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred ");
    }
  };

  const handleEdit = (item: DailyUpdateItem) => {
    setEditUpdate(item);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editUpdate) return;

    try {
      const res = await fetch("/api/admin/daily-updates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editUpdate.id,
          symbol: editUpdate.symbol,
          subtitle_en: editUpdate.subtitle_en,
          subtitle_ar: editUpdate.subtitle_ar,
          description_en: editUpdate.description_en,
          description_ar: editUpdate.description_ar,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update daily update");
      }

      setIsEditModalOpen(false);
      setEditUpdate(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-royalBlue">Daily Updates Management</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Add Daily Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label
                  htmlFor="symbol"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Symbol
                </label>
                <Input
                  id="symbol"
                  value={newUpdate.symbol}
                  onChange={(e) =>
                    setNewUpdate({
                      ...newUpdate,
                      symbol: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Enter stock symbol"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="subtitle_en"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  English Subtitle (optional)
                </label>
                <Input
                  id="subtitle_en"
                  value={newUpdate.subtitle.en}
                  onChange={(e) =>
                    setNewUpdate({
                      ...newUpdate,
                      subtitle: { ...newUpdate.subtitle, en: e.target.value },
                    })
                  }
                  placeholder="Short one-line teaser"
                />
              </div>
              <div>
                <label
                  htmlFor="subtitle_ar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Arabic Subtitle (optional)
                </label>
                <Input
                  id="subtitle_ar"
                  value={newUpdate.subtitle.ar}
                  onChange={(e) =>
                    setNewUpdate({
                      ...newUpdate,
                      subtitle: { ...newUpdate.subtitle, ar: e.target.value },
                    })
                  }
                  placeholder="ملخص قصير"
                  dir="rtl"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="description_en"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  English Description
                </label>
                <Textarea
                  id="description_en"
                  value={newUpdate.description.en}
                  onChange={(e) =>
                    setNewUpdate({
                      ...newUpdate,
                      description: { ...newUpdate.description, en: e.target.value },
                    })
                  }
                  placeholder="Enter the full English update"
                  rows={5}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="description_ar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Arabic Description
                </label>
                <Textarea
                  id="description_ar"
                  value={newUpdate.description.ar}
                  onChange={(e) =>
                    setNewUpdate({
                      ...newUpdate,
                      description: { ...newUpdate.description, ar: e.target.value },
                    })
                  }
                  placeholder="أدخل التحديث الكامل باللغة العربية"
                  rows={5}
                  required
                  dir="rtl"
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button
              type="submit"
              className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Add Daily Update
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Bulk Add Daily Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="bulkUpdates"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Paste Daily Updates Array (JSON format)
              </label>
              <Textarea
                id="bulkUpdates"
                value={bulkUpdates}
                onChange={(e) => setBulkUpdates(e.target.value)}
                placeholder='[{"symbol": "SCLX","subtitle": {"en": "Short teaser","ar": "ملخص قصير"},"description": {"en": "Full update text","ar": "النص الكامل للتحديث"}}]'
                className="font-mono"
                rows={10}
                required
              />
            </div>
            <Button
              type="submit"
              className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Bulk Add Daily Updates
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Daily Updates List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>English Subtitle</TableHead>
                  <TableHead>Arabic Subtitle</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyUpdates?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.symbol}</TableCell>
                    <TableCell>{item.subtitle_en || "—"}</TableCell>
                    <TableCell dir="rtl">{item.subtitle_ar || "—"}</TableCell>
                    <TableCell>{formatDate(item.published_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditDailyUpdateModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditUpdate(null);
        }}
        editDailyUpdate={editUpdate}
        setEditDailyUpdate={setEditUpdate}
        handleEditSubmit={handleEditSubmit}
      />
    </div>
  );
}
