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
import { PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import useSWR from "swr";
import { Textarea } from "@/components/ui/textarea";

interface Breakthrough {
  id: number;
  title_en: string;
  title_ar: string;
  company: string;
  symbol: string;
  description_en: string;
  description_ar: string;
  potential_impact_en: string;
  potential_impact_ar: string;
  category: "drug" | "therapy" | "device";
  stage: "research" | "clinical" | "approved";
  created_at: string;
}

const fetchBreakthroughs = async (): Promise<Breakthrough[]> => {
  const res = await fetch("/api/admin/breakthroughs");
  if (!res.ok) throw new Error("Failed to fetch breakthroughs");
  const data = await res.json();
  return data;
};

export default function BreakthroughsManagement() {
  const [newBreakthrough, setNewBreakthrough] = useState({
    title_en: "",
    title_ar: "",
    company: "",
    symbol: "",
    description_en: "",
    description_ar: "",
    potential_impact_en: "",
    potential_impact_ar: "",
    category: "drug",
    stage: "research",
  });
  const [error, setError] = useState<string | null>(null);
  const [bulkBreakthroughs, setBulkBreakthroughs] = useState("");

  const { data: breakthroughs, mutate } = useSWR<Breakthrough[]>(
    "/api/admin/breakthroughs",
    fetchBreakthroughs
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/admin/breakthroughs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBreakthrough),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add breakthrough");
      }

      // Reset form and refresh data
      setNewBreakthrough({
        title_en: "",
        title_ar: "",
        company: "",
        symbol: "",
        description_en: "",
        description_ar: "",
        potential_impact_en: "",
        potential_impact_ar: "",
        category: "drug",
        stage: "research",
      });
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/breakthroughs`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete breakthrough");
      }

      mutate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete breakthrough"
      );
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let breakthroughsArray;
      try {
        breakthroughsArray = JSON.parse(bulkBreakthroughs);
        if (!Array.isArray(breakthroughsArray)) {
          throw new Error("Input must be an array of breakthroughs");
        }
      } catch (err) {
        console.log(err);
        throw new Error("Invalid JSON format");
      }

      const res = await fetch("/api/admin/breakthroughs/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bulkBreakthroughs,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add breakthroughs");
      }

      // Reset form and refresh data
      setBulkBreakthroughs("");
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
      <h1 className="text-3xl font-bold text-royalBlue">
        Breakthroughs Management
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Add Breakthrough
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Company
                </label>
                <Input
                  id="company"
                  value={newBreakthrough.company}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      company: e.target.value,
                    })
                  }
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="symbol"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Symbol
                </label>
                <Input
                  id="symbol"
                  value={newBreakthrough.symbol}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      symbol: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Enter stock symbol"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="title_en"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  English Title
                </label>
                <Textarea
                  id="title_en"
                  value={newBreakthrough.title_en}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      title_en: e.target.value,
                    })
                  }
                  placeholder="Enter English title"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="title_ar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Arabic Title
                </label>
                <Textarea
                  id="title_ar"
                  value={newBreakthrough.title_ar}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      title_ar: e.target.value,
                    })
                  }
                  placeholder="Enter Arabic title"
                  required
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
                  value={newBreakthrough.description_en}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      description_en: e.target.value,
                    })
                  }
                  placeholder="Enter English description"
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
                  value={newBreakthrough.description_ar}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      description_ar: e.target.value,
                    })
                  }
                  placeholder="Enter Arabic description"
                  required
                  dir="rtl"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="potential_impact_en"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  English Potential Impact
                </label>
                <Textarea
                  id="potential_impact_en"
                  value={newBreakthrough.potential_impact_en}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      potential_impact_en: e.target.value,
                    })
                  }
                  placeholder="Enter English potential impact"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="potential_impact_ar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Arabic Potential Impact
                </label>
                <Textarea
                  id="potential_impact_ar"
                  value={newBreakthrough.potential_impact_ar}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      potential_impact_ar: e.target.value,
                    })
                  }
                  placeholder="Enter Arabic potential impact"
                  required
                  dir="rtl"
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={newBreakthrough.category}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      category: e.target.value as "drug" | "therapy" | "device",
                    })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="drug">Drug</option>
                  <option value="therapy">Therapy</option>
                  <option value="device">Device</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="stage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Stage
                </label>
                <select
                  id="stage"
                  value={newBreakthrough.stage}
                  onChange={(e) =>
                    setNewBreakthrough({
                      ...newBreakthrough,
                      stage: e.target.value as
                        | "research"
                        | "clinical"
                        | "approved",
                    })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="research">Research</option>
                  <option value="clinical">Clinical</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button
              type="submit"
              className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Add Breakthrough
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Bulk Add Breakthroughs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="bulkBreakthroughs"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Paste Breakthroughs Array (JSON format)
              </label>
              <Textarea
                id="bulkBreakthroughs"
                value={bulkBreakthroughs}
                onChange={(e) => setBulkBreakthroughs(e.target.value)}
                placeholder='[{"title_en": "Title in English", "title_ar": "العنوان بالعربية", ...}]'
                className="font-mono"
                rows={10}
                required
              />
            </div>
            <Button
              type="submit"
              className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Bulk Add Breakthroughs
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Breakthroughs List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakthroughs?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.company}
                    </TableCell>
                    <TableCell>{item.symbol}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.stage}</TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
