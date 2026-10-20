"use client";

import type React from "react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Eye, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { MarkdownContent } from "@/components/MarkdownContent";
import type { PaginationMeta } from "@/lib/mobile/paginate";
import {
  ANNOUNCEMENT_EXAMPLE,
  announcementIssues,
  announcementSchema,
  type AnnouncementInput,
} from "@/modules/stocks/announcement.schema";

interface AnnouncementRow {
  id: number;
  symbol: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  source_url: string | null;
  announced_at: string | null;
  published_date: string;
}

interface AnnouncementsResponse {
  data: AnnouncementRow[];
  pagination: PaginationMeta;
}

const fetchAnnouncements = async (url: string): Promise<AnnouncementsResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch announcements");
  return res.json();
};

type Issue = { path: string; message: string };

export default function AnnouncementsManagement() {
  const [page, setPage] = useState(1);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [raw, setRaw] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AnnouncementInput | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notify, setNotify] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (symbolFilter.trim()) params.set("symbol", symbolFilter.trim().toUpperCase());
    return params.toString();
  }, [page, symbolFilter]);

  const { data, mutate } = useSWR<AnnouncementsResponse>(
    `/api/admin/announcements?${query}`,
    fetchAnnouncements
  );

  const resetForm = () => {
    setRaw("");
    setPreview(null);
    setIssues([]);
    setParseError(null);
    setEditingId(null);
    setNotify(true);
  };

  /** Validates the pasted JSON with the same schema the API uses. */
  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIssues([]);
    setParseError(null);
    setPreview(null);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      setParseError("That is not valid JSON. Check for a trailing comma or a missing quote.");
      return;
    }

    if (Array.isArray(parsedJson)) {
      setParseError(
        "Announcements are published one at a time. Paste a single JSON object, not an array."
      );
      return;
    }

    const result = announcementSchema.safeParse(parsedJson);
    if (!result.success) {
      setIssues(announcementIssues(result.error));
      return;
    }

    setPreview(result.data);
  };

  const handlePublish = async () => {
    if (!preview) return;
    setBusy(true);
    setStatus(null);
    try {
      const isEdit = editingId !== null;
      const res = await fetch("/api/admin/announcements", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preview,
          ...(isEdit ? { id: editingId } : { notify }),
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const serverIssues = payload?.issues as Issue[] | undefined;
        if (serverIssues?.length) setIssues(serverIssues);
        throw new Error(payload?.error || "Failed to save announcement");
      }

      setStatus(
        isEdit
          ? "Announcement updated. Watchers were not notified again."
          : notify
            ? "Published. Watchers with alerts on have been notified."
            : "Published silently — no notifications were sent."
      );
      resetForm();
      mutate();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (row: AnnouncementRow) => {
    setEditingId(row.id);
    setIssues([]);
    setParseError(null);
    setStatus(null);
    const asInput = {
      symbol: row.symbol,
      title: { en: row.title_en, ar: row.title_ar },
      content: { en: row.content_en, ar: row.content_ar },
      ...(row.source_url ? { source_url: row.source_url } : {}),
      ...(row.announced_at
        ? { announced_at: row.announced_at.slice(0, 10) }
        : {}),
    };
    setRaw(JSON.stringify(asInput, null, 2));
    setPreview(asInput as AnnouncementInput);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this announcement? This cannot be undone.")) return;
    setStatus(null);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      if (editingId === id) resetForm();
      mutate();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-royalBlue">Company Announcements</h1>
        <p className="mt-1 text-sm text-gray-600">
          Paste one announcement as JSON, preview both languages, then publish.
          Publishing notifies the users watching that symbol with alerts on —
          once each.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            {editingId === null ? "New Announcement" : `Editing #${editingId}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handlePreview} className="space-y-4">
            <div>
              <label
                htmlFor="raw"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Announcement JSON — `content` is Markdown; keep the English
                verbatim from the source
              </label>
              <Textarea
                id="raw"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={ANNOUNCEMENT_EXAMPLE}
                className="font-mono"
                rows={14}
                required
              />
            </div>

            {parseError && <p className="text-sm text-red-500">{parseError}</p>}
            {issues.length > 0 && (
              <ul className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {issues.map((issue, index) => (
                  <li key={`${issue.path}-${index}`}>
                    <span className="font-mono">{issue.path || "(root)"}</span>:{" "}
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="outline">
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>
              {editingId !== null && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" /> Cancel edit
                </Button>
              )}
              {editingId === null && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                  />
                  Notify watchers
                </label>
              )}
            </div>
          </form>

          {preview && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    English — {preview.symbol.toUpperCase()}
                  </p>
                  <h3 className="mb-2 text-lg font-semibold text-royalBlue">
                    {preview.title.en}
                  </h3>
                  <MarkdownContent lang="en">{preview.content.en}</MarkdownContent>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    العربية — {preview.symbol.toUpperCase()}
                  </p>
                  <h3 className="mb-2 text-right text-lg font-semibold text-royalBlue" dir="rtl">
                    {preview.title.ar}
                  </h3>
                  <MarkdownContent lang="ar">{preview.content.ar}</MarkdownContent>
                </div>
              </div>

              <Button
                type="button"
                onClick={handlePublish}
                disabled={busy}
                className="bg-brightTeal text-pureWhite hover:bg-brightTeal/90"
              >
                <Send className="mr-2 h-4 w-4" />
                {editingId === null ? "Publish Announcement" : "Save Changes"}
              </Button>
            </div>
          )}

          {status && <p className="text-sm text-gray-700">{status}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Published Announcements
          </CardTitle>
          <Input
            value={symbolFilter}
            onChange={(e) => {
              setSymbolFilter(e.target.value.toUpperCase());
              setPage(1);
            }}
            placeholder="Filter by symbol"
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>English Title</TableHead>
                  <TableHead>Arabic Title</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.symbol}</TableCell>
                    <TableCell className="max-w-sm truncate">{row.title_en}</TableCell>
                    <TableCell className="max-w-sm truncate" dir="rtl">
                      {row.title_ar}
                    </TableCell>
                    <TableCell>
                      {format(new Date(row.published_date), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => handleEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No announcements yet.
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
