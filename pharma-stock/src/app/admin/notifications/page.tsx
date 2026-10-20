"use client";

import type React from "react";
import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Bell, Send } from "lucide-react";
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

/**
 * Send a notification to every user, in both languages.
 *
 * The general-purpose announcement tool: each user sees it in their own
 * language, in the app's Notifications tab and as a push. Tapping it opens the
 * Notifications tab.
 */

interface SentNotification {
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  created_at: string;
  recipients: number;
}

const fetchSent = async (url: string): Promise<{ data: SentNotification[] }> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch sent notifications");
  return res.json();
};

const emptyDraft = {
  titleEn: "",
  titleAr: "",
  bodyEn: "",
  bodyAr: "",
};

export default function NotificationsSender() {
  const [draft, setDraft] = useState(emptyDraft);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, mutate } = useSWR("/api/admin/notifications", fetchSent);

  const complete =
    draft.titleEn.trim() &&
    draft.titleAr.trim() &&
    draft.bodyEn.trim() &&
    draft.bodyAr.trim();

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setConfirming(true);
  };

  const handleSend = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: { en: draft.titleEn, ar: draft.titleAr },
          body: { en: draft.bodyEn, ar: draft.bodyAr },
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const issues = payload?.issues as { message: string }[] | undefined;
        throw new Error(
          issues?.length
            ? issues.map((i) => i.message).join(", ")
            : payload?.error || "Failed to send notification"
        );
      }

      setSuccess(
        `Sent to ${payload.recipients} user${payload.recipients === 1 ? "" : "s"}. ` +
          "Each one sees it in their own language."
      );
      setDraft(emptyDraft);
      setConfirming(false);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-royalBlue">Send Notification</h1>
        <p className="mt-1 text-sm text-gray-600">
          Goes to <strong>every user</strong> — in the app&apos;s Notifications
          tab and as a push. Write both languages: each user is shown the one
          matching their app language. Keep it short; a push shows roughly two
          lines.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Notification Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReview} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="titleEn"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  English Title
                </label>
                <Input
                  id="titleEn"
                  value={draft.titleEn}
                  onChange={(e) => {
                    setDraft({ ...draft, titleEn: e.target.value });
                    setConfirming(false);
                  }}
                  placeholder="Platform update"
                  maxLength={120}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="titleAr"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Arabic Title
                </label>
                <Input
                  id="titleAr"
                  value={draft.titleAr}
                  onChange={(e) => {
                    setDraft({ ...draft, titleAr: e.target.value });
                    setConfirming(false);
                  }}
                  placeholder="تحديث على المنصة"
                  maxLength={120}
                  dir="rtl"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="bodyEn"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  English Message
                </label>
                <Textarea
                  id="bodyEn"
                  value={draft.bodyEn}
                  onChange={(e) => {
                    setDraft({ ...draft, bodyEn: e.target.value });
                    setConfirming(false);
                  }}
                  placeholder="What you want every user to know."
                  rows={4}
                  maxLength={1000}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="bodyAr"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Arabic Message
                </label>
                <Textarea
                  id="bodyAr"
                  value={draft.bodyAr}
                  onChange={(e) => {
                    setDraft({ ...draft, bodyAr: e.target.value });
                    setConfirming(false);
                  }}
                  placeholder="النص الذي تريد أن يعرفه كل المستخدمين."
                  rows={4}
                  maxLength={1000}
                  dir="rtl"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}

            {!confirming ? (
              <Button type="submit" variant="outline" disabled={!complete}>
                <Bell className="mr-2 h-4 w-4" /> Review
              </Button>
            ) : (
              <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      English
                    </p>
                    <p className="font-semibold text-slate-900">{draft.titleEn}</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {draft.bodyEn}
                    </p>
                  </div>
                  <div
                    className="rounded-md border border-slate-200 bg-white p-3 text-right"
                    dir="rtl"
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      العربية
                    </p>
                    <p className="font-semibold text-slate-900">{draft.titleAr}</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {draft.bodyAr}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  This cannot be unsent. Send it to every user?
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={busy}
                    className="bg-brightTeal text-pureWhite hover:bg-brightTeal/90"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {busy ? "Sending…" : "Send to all users"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                  >
                    Keep editing
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Recently Sent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent</TableHead>
                  <TableHead>English Title</TableHead>
                  <TableHead>Arabic Title</TableHead>
                  <TableHead>Recipients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((row) => (
                  <TableRow key={`${row.created_at}-${row.title_en}`}>
                    <TableCell>
                      {format(new Date(row.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell className="max-w-sm truncate">{row.title_en}</TableCell>
                    <TableCell className="max-w-sm truncate" dir="rtl">
                      {row.title_ar}
                    </TableCell>
                    <TableCell>{row.recipients}</TableCell>
                  </TableRow>
                ))}
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Nothing sent yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
