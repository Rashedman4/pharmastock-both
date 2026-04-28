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
import { EditNewsModal } from "@/components/admin/editNews";

interface NewsItem {
  id: number;
  title_en: string;
  title_ar: string;
  symbol: string;
  price: number;
  published_date: string;
}

const fetchNews = async (): Promise<NewsItem[]> => {
  const res = await fetch("/api/admin/news");
  if (!res.ok) throw new Error("Failed to fetch news");
  const data = await res.json();
  return data;
};

export default function NewsManagement() {
  const [newNews, setNewNews] = useState({
    symbol: "",
    title: {
      en: "",
      ar: "",
    },
    price: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [bulkNews, setBulkNews] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNews, setEditNews] = useState<NewsItem | null>(null);

  const { data: news, mutate } = useSWR<NewsItem[]>(
    "/api/admin/news",
    fetchNews
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNews),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add news");
      }

      // Reset form and refresh data
      setNewNews({
        symbol: "",
        title: {
          en: "",
          ar: "",
        },
        price: 0,
      });
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/news`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete news");
      }

      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete news");
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let newsArray;
      try {
        newsArray = JSON.parse(bulkNews);
        if (!Array.isArray(newsArray)) {
          throw new Error("Input must be an array of news items");
        }
      } catch (err) {
        console.log(err);
        throw new Error("Invalid JSON format");
      }

      const res = await fetch("/api/admin/news/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bulkNews,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add news");
      }

      // Reset form and refresh data
      setBulkNews("");
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred ");
    }
  };

  const handleEdit = (newsItem: NewsItem) => {
    setEditNews(newsItem);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editNews) return;

    try {
      const res = await fetch("/api/admin/news", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editNews.id,
          title_en: editNews.title_en,
          title_ar: editNews.title_ar,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update news");
      }

      setIsEditModalOpen(false);
      setEditNews(null);
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
      <h1 className="text-3xl font-bold text-royalBlue">News Management</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Add News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="symbol"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Symbol
                </label>
                <Input
                  id="symbol"
                  value={newNews.symbol}
                  onChange={(e) =>
                    setNewNews({
                      ...newNews,
                      symbol: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Enter stock symbol"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newNews.price}
                  onChange={(e) =>
                    setNewNews({
                      ...newNews,
                      price: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Enter price"
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
                  value={newNews.title.en}
                  onChange={(e) =>
                    setNewNews({
                      ...newNews,
                      title: {
                        ...newNews.title,
                        en: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter English news title"
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
                  value={newNews.title.ar}
                  onChange={(e) =>
                    setNewNews({
                      ...newNews,
                      title: {
                        ...newNews.title,
                        ar: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter Arabic news title"
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
              <PlusCircle className="w-4 h-4 mr-2" /> Add News
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Bulk Add News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="bulkNews"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Paste News Array (JSON format)
              </label>
              <Textarea
                id="bulkNews"
                value={bulkNews}
                onChange={(e) => setBulkNews(e.target.value)}
                placeholder='[{"symbol": "SCLX","title": {"en": "News title","ar": "العنوان"},"price": 0.32}]'
                className="font-mono"
                rows={10}
                required
              />
            </div>
            <Button
              type="submit"
              className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Bulk Add News
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            News List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>English Title</TableHead>
                  <TableHead>Arabic Title</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.symbol}</TableCell>
                    <TableCell>${item.price}</TableCell>
                    <TableCell>{item.title_en}</TableCell>
                    <TableCell dir="rtl">{item.title_ar}</TableCell>
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

      <EditNewsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditNews(null);
        }}
        editNews={editNews}
        setEditNews={setEditNews}
        handleEditSubmit={handleEditSubmit}
      />
    </div>
  );
}
