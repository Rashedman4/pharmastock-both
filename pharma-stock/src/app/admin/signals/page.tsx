"use client";
import React, { useState, useCallback, useEffect } from "react";
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
import { PlusCircle, Edit, X } from "lucide-react";
import { Signal, RawSignal } from "@/types/signal";
import { EditSignalModal } from "@/components/admin/editSignal";
import useSWR from "swr";
import { Textarea } from "@/components/ui/textarea";

// Fetch signals function
const fetchSignals = async (): Promise<Signal[]> => {
  const res = await fetch("/api/admin/signals", { cache: "no-store" });
  const data = await res.json();
  const transformedData: Signal[] = data.map(
    ({
      enter_price,
      price_now,
      first_target,
      second_target,
      date_opened,
      ...rest
    }: RawSignal): Signal => ({
      priceNow: price_now,
      enterPrice: enter_price,
      firstTarget: first_target,
      secondTarget: second_target,
      dateOpened: date_opened,
      ...rest,
    })
  );

  return transformedData;
};

// Add signal function (Omit 'id' and 'status')
const addSignalToBackend = async (
  newSignal: Omit<Signal, "id" | "dateOpened" | "type" | "priceNow">
): Promise<{ error?: string }> => {
  const res = await fetch("/api/admin/signals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newSignal),
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error || "Failed to add new signal" };
  }
  return {};
};
// Delete signal function
const deleteSignalFromBackend = async (
  id: number,
  closeSignal: string
): Promise<void> => {
  const res = await fetch(`/api/admin/signals`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, closeSignal }),
  });
  if (!res.ok) {
    console.error("Failed to delete signal.");
  }
};

const SignalsManagement: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);

  const { data, error, mutate } = useSWR<Signal[]>(
    "/api/admin/signals",
    fetchSignals,
    {
      refreshInterval: 60000,
    }
  );
  if (error) {
    console.log("something went wrong.");
  }
  useEffect(() => {
    if (data) {
      setSignals(data);
    }
  }, [data]);

  const [newSignal, setNewSignal] = useState<
    Omit<Signal, "id" | "dateOpened" | "type" | "priceNow">
  >({
    symbol: "",
    enterPrice: 0,
    firstTarget: 0,
    secondTarget: 0,
    reason_ar: "",
    reason_en: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSignal, setEditSignal] = useState<Signal | null>(null);
  const [signalError, setSignalError] = useState<string | null>(null);

  // Delete a signal
  const deleteSignal = useCallback(
    async (id: number, closeSignal: string) => {
      await deleteSignalFromBackend(id, closeSignal);
      mutate(); // Refresh signals
    },
    [mutate]
  );

  // Function to open modal with the selected signal
  const openEditModal = (signal: Signal) => {
    setEditSignal(signal); // Set signal to be edited
    setIsModalOpen(true); // Open the modal
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false); // Close the modal
    setEditSignal(null); // Clear the current edit signal
  };

  // Add a new signal
  const addSignal = async () => {
    const result = await addSignalToBackend(newSignal);
    if (result.error) {
      setSignalError(result.error);
    } else {
      mutate(); // Refresh signals
      setNewSignal({
        symbol: "",
        enterPrice: 0,
        firstTarget: 0,
        secondTarget: 0,
        reason_en: "",
        reason_ar: "",
      });
      setSignalError(null);
    }
  };

  // Function to handle submitting the updated signal
  const handleEditSubmit = async () => {
    if (editSignal) {
      const res = await fetch(`/api/admin/signals`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editSignal), // Send updated signal data
      });

      if (res.ok) {
        setIsModalOpen(false); // Close modal on success
        setEditSignal(null); // Clear current signal after submit
        mutate(); // Refresh signals
      } else {
        console.error("Failed to edit signal");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold  text-royalBlue">
              Signals Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <h2 className="text-xl font-semibold  text-brightTeal mb-4">
                Add New Signal
              </h2>
              {signalError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {signalError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="symbol"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Symbol
                  </label>
                  <Input
                    id="symbol"
                    placeholder="Enter symbol"
                    value={newSignal.symbol}
                    onChange={(e) =>
                      setNewSignal({
                        ...newSignal,
                        symbol: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="enterPrice"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Enter Price
                  </label>
                  <Input
                    id="enterPrice"
                    placeholder="Enter price"
                    type="number"
                    value={newSignal.enterPrice}
                    onChange={(e) =>
                      setNewSignal({
                        ...newSignal,
                        enterPrice: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="firstTarget"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Target
                  </label>
                  <Input
                    id="firstTarget"
                    placeholder="First target"
                    type="number"
                    value={newSignal.firstTarget}
                    onChange={(e) =>
                      setNewSignal({
                        ...newSignal,
                        firstTarget: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="secondTarget"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Second Target
                  </label>
                  <Input
                    id="secondTarget"
                    placeholder="Second target"
                    type="number"
                    value={newSignal.secondTarget}
                    onChange={(e) =>
                      setNewSignal({
                        ...newSignal,
                        secondTarget: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-full">
                  <label
                    htmlFor="reason_en"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Reason English
                  </label>
                  <Textarea
                    id="reason_en"
                    placeholder="Enter reason"
                    value={newSignal.reason_en}
                    onChange={(e) =>
                      setNewSignal({
                        ...newSignal,
                        reason_en: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-full">
                  <label
                    htmlFor="reason_ar"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Reason Arabic
                  </label>
                  <Textarea
                    id="reason_ar"
                    placeholder="Enter reason"
                    value={newSignal.reason_ar}
                    onChange={(e) =>
                      setNewSignal({
                        ...newSignal,
                        reason_ar: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Button
                className="w-full md:w-auto bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
                onClick={addSignal}
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Signal
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Enter Price</TableHead>
                    <TableHead>Price Now</TableHead>
                    <TableHead>First Target</TableHead>
                    <TableHead>Second Target</TableHead>
                    <TableHead>Date Opened</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals?.map((signal: Signal) => (
                    <TableRow key={signal.id}>
                      <TableCell>{signal.symbol}</TableCell>
                      <TableCell>{signal.type}</TableCell>
                      <TableCell>${signal.enterPrice}</TableCell>
                      <TableCell>${signal.priceNow}</TableCell>
                      <TableCell>${signal.firstTarget}</TableCell>
                      <TableCell>${signal.secondTarget}</TableCell>
                      <TableCell>{signal.dateOpened}</TableCell>
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
                            onClick={() => deleteSignal(signal.id, "yes")}
                          >
                            Close
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSignal(signal.id, "no")}
                          >
                            <X className="w-4 h-4" />
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
      </main>
      {/* Modal for editing signal */}
      {editSignal && (
        <EditSignalModal
          isOpen={isModalOpen}
          onClose={closeModal} // Pass closeModal to handle closing
          editSignal={editSignal} // Pass the signal to be edited
          setEditSignal={setEditSignal} // Allow setting the new values in the modal
          handleEditSubmit={handleEditSubmit} // Handle submit logic
        />
      )}
    </div>
  );
};

export default SignalsManagement;
