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
import { Pencil, Save, X } from "lucide-react";
import useSWR from "swr";

interface CommunityLink {
  id: string;
  url: string;
  name_en?: string;
  name_ar?: string;
}

const fetchCommunityLinks = async (): Promise<CommunityLink[]> => {
  const res = await fetch("/api/community");
  if (!res.ok) throw new Error("Failed to fetch community links");
  const data = await res.json();
  return data;
};

export default function CommunityManagement() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { data: links, mutate } = useSWR<CommunityLink[]>(
    "/api/community",
    fetchCommunityLinks
  );

  const handleEdit = (link: CommunityLink) => {
    setEditingId(link.id);
    setEditUrl(link.url);
    setError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditUrl("");
    setError(null);
  };

  const handleSave = async (id: string) => {
    setError(null);

    if (!editUrl.trim()) {
      setError("URL cannot be empty");
      return;
    }

    try {
      const res = await fetch("/api/community", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, url: editUrl.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update URL");
      }

      setEditingId(null);
      setEditUrl("");
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-royalBlue">
        Community Management
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Community Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name (English)</TableHead>
                  <TableHead>Name (Arabic)</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links?.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.id}</TableCell>
                    <TableCell>{link.name_en || "-"}</TableCell>
                    <TableCell dir="rtl">{link.name_ar || "-"}</TableCell>
                    <TableCell>
                      {editingId === link.id ? (
                        <Input
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="min-w-[400px]"
                          placeholder="Enter URL"
                        />
                      ) : (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {link.url}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === link.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSave(link.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(link)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit URL
                        </Button>
                      )}
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
