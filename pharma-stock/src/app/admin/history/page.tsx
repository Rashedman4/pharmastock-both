"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { format } from "date-fns";

interface SignalHistory {
  id: number;
  symbol: string;
  entrance_date: string;
  closing_date: string;
  in_price: number;
  out_price: number;
  success: boolean;
  reason_ar: string;
  reason_en: string;
  created_at: string;
}

const fetchHistory = async (): Promise<SignalHistory[]> => {
  const res = await fetch("/api/admin/history");
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
};

const HistoryManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSignal, setEditSignal] = useState<SignalHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding new signal
  const [newSignal, setNewSignal] = useState({
    symbol: "",
    entrance_date: "",
    closing_date: "",
    in_price: "",
    out_price: "",
    success: true,
    reason_ar: "",
    reason_en: "",
  });

  const { data: history, mutate } = useSWR<SignalHistory[]>(
    "/api/admin/history",
    fetchHistory
  );

  const openEditModal = (signal: SignalHistory) => {
    setEditSignal(signal);
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditSignal(null);
    setError(null);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewSignal({
      symbol: "",
      entrance_date: "",
      closing_date: "",
      in_price: "",
      out_price: "",
      success: true,
      reason_ar: "",
      reason_en: "",
    });
    setError(null);
  };

  // ✅ PUT (edit)
  const handleEditSubmit = async () => {
    if (!editSignal) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSignal),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update signal");
      }

      closeModal();
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ POST (add)
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSignal,
          in_price: parseFloat(newSignal.in_price),
          out_price: parseFloat(newSignal.out_price),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add signal");
      }

      closeAddModal();
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ DELETE
  const deleteSignal = useCallback(
    async (id: number) => {
      if (!confirm("Are you sure you want to delete this record?")) return;

      try {
        const res = await fetch("/api/admin/history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete record");
        }

        mutate();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete record"
        );
      }
    },
    [mutate]
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const calculateProfit = (inPrice: number, outPrice: number) => {
    const profit = ((outPrice - inPrice) / inPrice) * 100;
    return profit.toFixed(2);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-royalBlue">
          History Management
        </h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Add History Signal
        </Button>
      </div>

      {error && !isModalOpen && !isAddModalOpen && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Entrance Date</TableHead>
              <TableHead>Closing Date</TableHead>
              <TableHead>In Price</TableHead>
              <TableHead>Out Price</TableHead>
              <TableHead>Profit/Loss</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason (EN)</TableHead>
              <TableHead>Reason (AR)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {history?.map((signal) => {
              const profitLoss = calculateProfit(
                signal.in_price,
                signal.out_price
              );

              return (
                <TableRow key={signal.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-royalBlue/10 text-royalBlue"
                    >
                      {signal.symbol}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(signal.entrance_date)}</TableCell>
                  <TableCell>{formatDate(signal.closing_date)}</TableCell>
                  <TableCell>${signal.in_price}</TableCell>
                  <TableCell>${signal.out_price}</TableCell>
                  <TableCell>
                    <span
                      className={
                        Number.parseFloat(profitLoss) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {profitLoss}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {signal.success ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={signal.reason_en}>
                      {signal.reason_en || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={signal.reason_ar}>
                      {signal.reason_ar || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(signal)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSignal(signal.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {(!history || history.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-gray-500"
                >
                  No history records found. Add your first entry to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[600px] bg-pureWhite max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-royalBlue">
              Edit History Record
            </DialogTitle>
          </DialogHeader>
          {editSignal && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSubmit();
              }}
            >
              <div className="grid gap-4 py-4">
                {[
                  "symbol",
                  "entrance_date",
                  "closing_date",
                  "in_price",
                  "out_price",
                ].map((field) => (
                  <div
                    key={field}
                    className="grid grid-cols-4 items-center gap-4"
                  >
                    <Label
                      htmlFor={`edit-${field}`}
                      className="text-right capitalize"
                    >
                      {field.replace("_", " ")}
                    </Label>
                    <Input
                      id={`edit-${field}`}
                      type={
                        field.includes("date")
                          ? "date"
                          : field.includes("price")
                          ? "number"
                          : "text"
                      }
                      value={
                        editSignal[field as keyof SignalHistory]
                          ?.toString()
                          .split("T")[0] ?? ""
                      }
                      onChange={(e) =>
                        setEditSignal({
                          ...editSignal,
                          [field]: e.target.value,
                        } as SignalHistory)
                      }
                      className="col-span-3"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-success" className="text-right">
                    Success
                  </Label>
                  <div className="col-span-3">
                    <select
                      id="edit-success"
                      value={editSignal.success ? "true" : "false"}
                      onChange={(e) =>
                        setEditSignal({
                          ...editSignal,
                          success: e.target.value === "true",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brightTeal"
                    >
                      <option value="true">Success</option>
                      <option value="false">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-reason-en" className="text-right">
                    Reason (EN)
                  </Label>
                  <Textarea
                    id="edit-reason-en"
                    value={editSignal.reason_en ?? ""}
                    onChange={(e) =>
                      setEditSignal({
                        ...editSignal,
                        reason_en: e.target.value,
                      })
                    }
                    className="col-span-3"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-reason-ar" className="text-right">
                    Reason (AR)
                  </Label>
                  <Textarea
                    id="edit-reason-ar"
                    value={editSignal.reason_ar ?? ""}
                    onChange={(e) =>
                      setEditSignal({
                        ...editSignal,
                        reason_ar: e.target.value,
                      })
                    }
                    className="col-span-3"
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ Add Modal (fixed and full fields added) */}
      <Dialog open={isAddModalOpen} onOpenChange={closeAddModal}>
        <DialogContent className="sm:max-w-[600px] bg-pureWhite max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-royalBlue">
              Add New History Record
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              {[
                "symbol",
                "entrance_date",
                "closing_date",
                "in_price",
                "out_price",
              ].map((field) => (
                <div
                  key={field}
                  className="grid grid-cols-4 items-center gap-4"
                >
                  <Label
                    htmlFor={`add-${field}`}
                    className="text-right capitalize"
                  >
                    {field.replace("_", " ")}
                  </Label>
                  <Input
                    id={`add-${field}`}
                    type={
                      field.includes("date")
                        ? "date"
                        : field.includes("price")
                        ? "number"
                        : "text"
                    }
                    value={(newSignal as any)[field] ?? ""}
                    onChange={(e) =>
                      setNewSignal({ ...newSignal, [field]: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
              ))}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-success" className="text-right">
                  Success
                </Label>
                <div className="col-span-3">
                  <select
                    id="add-success"
                    value={newSignal.success ? "true" : "false"}
                    onChange={(e) =>
                      setNewSignal({
                        ...newSignal,
                        success: e.target.value === "true",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brightTeal"
                  >
                    <option value="true">Success</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-reason-en" className="text-right">
                  Reason (EN)
                </Label>
                <Textarea
                  id="add-reason-en"
                  value={newSignal.reason_en ?? ""}
                  onChange={(e) =>
                    setNewSignal({ ...newSignal, reason_en: e.target.value })
                  }
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-reason-ar" className="text-right">
                  Reason (AR)
                </Label>
                <Textarea
                  id="add-reason-ar"
                  value={newSignal.reason_ar ?? ""}
                  onChange={(e) =>
                    setNewSignal({ ...newSignal, reason_ar: e.target.value })
                  }
                  className="col-span-3"
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeAddModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryManagement;
