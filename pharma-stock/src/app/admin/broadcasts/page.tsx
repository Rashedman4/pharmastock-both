"use client";

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
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
import { Textarea } from "@/components/ui/textarea";
import { Send, RefreshCw, Users, CheckSquare } from "lucide-react";

type Campaign = {
  id: string;
  title: string;
  message_type: string;
  audience_type: string;
  content: string | null;
  status: string;
  recipient_count: number;
  created_at: string;
  sent_at: string | null;
  firstname: string | null;
  lastname: string | null;
};

type UserItem = {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-200 text-slate-700",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
};

const AUDIENCE_LABELS: Record<string, string> = {
  all_users: "All Users",
  elite_users: "Elite Members",
  subscription_users: "Subscribers",
  custom: "Custom",
};

export default function BroadcastsPage() {
  const { data: campaignsData, mutate } = useSWR(
    "/api/admin/mobile/broadcasts?limit=100",
    fetcher
  );
  const campaigns: Campaign[] = campaignsData?.data ?? [];

  const [title, setTitle] = useState("");
  const [messageType, setMessageType] = useState<"text" | "image" | "voice" | "video">("text");
  const [content, setContent] = useState("");
  const [audienceType, setAudienceType] = useState<
    "all_users" | "elite_users" | "subscription_users" | "custom"
  >("all_users");
  const [customUserIds, setCustomUserIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  useEffect(() => {
    if (audienceType === "custom" && !usersLoaded) {
      fetch("/api/admin/mobile/users?limit=1000")
        .then((r) => r.json())
        .then((d) => {
          setUsers(d.data ?? []);
          setUsersLoaded(true);
        })
        .catch(() => setUsersLoaded(true));
    }
  }, [audienceType, usersLoaded]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        `${u.firstname ?? ""} ${u.lastname ?? ""}`.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const toggleUser = (id: number) => {
    setCustomUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredUsers.map((u) => u.id);
    setCustomUserIds((prev) => {
      const merged = new Set([...prev, ...ids]);
      return Array.from(merged);
    });
  };

  const clearSelection = () => setCustomUserIds([]);

  const handleCreate = async () => {
    setFormError(null);
    setSuccessMsg(null);
    if (!title.trim()) return setFormError("Title is required.");
    if (messageType === "text" && !content.trim())
      return setFormError("Content is required for text messages.");
    if (audienceType === "custom" && customUserIds.length === 0)
      return setFormError("Select at least one user for custom audience.");

    setCreating(true);
    try {
      const res = await fetch("/api/admin/mobile/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          messageType,
          content: content.trim() || undefined,
          audienceType,
          customUserIds: audienceType === "custom" ? customUserIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create broadcast");

      setTitle("");
      setContent("");
      setAudienceType("all_users");
      setCustomUserIds([]);
      setUserSearch("");
      setSuccessMsg(`Broadcast "${data.title}" created as draft. Click "Send Now" to deliver it.`);
      mutate();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to create broadcast");
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (campaignId: string, campaignTitle: string) => {
    if (
      !window.confirm(
        `Send "${campaignTitle}" now?\n\nThis will deliver the message privately to each recipient as a direct message in their chat inbox. This cannot be undone.`
      )
    )
      return;

    setSending(campaignId);
    try {
      const res = await fetch(`/api/admin/mobile/broadcasts/${campaignId}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send broadcast");
      mutate();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to send broadcast");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            New Broadcast
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Broadcasts are delivered as private direct messages. Each recipient sees it
            in their personal chat inbox and can reply 1-on-1 with you.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {formError && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {formError}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Portfolio Update"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={messageType}
                onChange={(e) =>
                  setMessageType(e.target.value as typeof messageType)
                }
              >
                <option value="text">Text message</option>
                <option value="image">Image</option>
                <option value="voice">Voice note</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          {messageType === "text" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Content <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message here. Recipients will see this as a private message from Admin."
                rows={5}
              />
              <p className="text-xs text-slate-400 mt-1">
                {content.length} characters
              </p>
            </div>
          )}

          {(messageType === "image" || messageType === "voice" || messageType === "video") && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              For media broadcasts, first upload the file via{" "}
              <code className="font-mono text-xs">POST /api/mobile/v1/uploads/chat</code>{" "}
              to get an <code className="font-mono text-xs">attachmentUrl</code>, then create
              this broadcast via the API with that URL. Media broadcasts from the UI
              are text-only for now.
            </div>
          )}

          {/* Audience Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audience <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={audienceType}
              onChange={(e) => {
                setAudienceType(e.target.value as typeof audienceType);
                setCustomUserIds([]);
              }}
            >
              <option value="all_users">All Users (everyone with the mobile app)</option>
              <option value="elite_users">Elite Members only</option>
              <option value="subscription_users">Subscription Users only</option>
              <option value="custom">Custom — pick specific users manually</option>
            </select>
          </div>

          {/* Custom User Picker */}
          {audienceType === "custom" && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4" />
                  Select Recipients
                  {customUserIds.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-brightTeal/15 px-2.5 py-0.5 text-xs font-semibold text-brightTeal">
                      {customUserIds.length} selected
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  {filteredUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="flex items-center gap-1 text-xs text-brightTeal hover:underline"
                    >
                      <CheckSquare className="w-3 h-3" />
                      Select all shown
                    </button>
                  )}
                  {customUserIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <Input
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />

              <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
                {!usersLoaded ? (
                  <p className="p-3 text-sm text-gray-500 text-center">
                    Loading users...
                  </p>
                ) : filteredUsers.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500 text-center">
                    No users found{userSearch ? ` for "${userSearch}"` : ""}
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={customUserIds.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brightTeal focus:ring-brightTeal"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {u.firstname} {u.lastname}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className="text-xs text-gray-300 font-mono">#{u.id}</span>
                    </label>
                  ))
                )}
              </div>

              {users.length > 0 && (
                <p className="text-xs text-slate-400">
                  {filteredUsers.length} of {users.length} users shown
                  {customUserIds.length > 0 && ` · ${customUserIds.length} selected`}
                </p>
              )}
            </div>
          )}

          <Button
            className="bg-brightTeal hover:bg-brightTeal/90 text-white"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Broadcast (saves as draft)"}
          </Button>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Broadcast Campaigns
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Draft campaigns can be sent whenever you are ready. Once sent, messages
            appear privately in each user&apos;s chat inbox — users can reply to start
            a 1-on-1 conversation with you.
          </p>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No broadcast campaigns yet. Create one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-xs">
                        <p className="truncate">{c.title}</p>
                        {c.content && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {c.content.slice(0, 60)}
                            {c.content.length > 60 ? "…" : ""}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {c.message_type}
                      </TableCell>
                      <TableCell className="text-sm">
                        {AUDIENCE_LABELS[c.audience_type] ?? c.audience_type}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.recipient_count > 0 ? (
                          <span className="font-medium text-green-700">
                            {c.recipient_count}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {new Date(c.created_at).toLocaleDateString()}{" "}
                        {new Date(c.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {(c.status === "draft" || c.status === "scheduled" || c.status === "failed") && (
                          <Button
                            size="sm"
                            className="bg-brightTeal hover:bg-brightTeal/90 text-white"
                            disabled={sending === c.id}
                            onClick={() => handleSend(c.id, c.title)}
                          >
                            {sending === c.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                Sending…
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3 mr-1" />
                                Send Now
                              </>
                            )}
                          </Button>
                        )}
                        {c.status === "sent" && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Delivered
                            {c.sent_at && (
                              <span className="ml-1 text-slate-400 font-normal">
                                {new Date(c.sent_at).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                        )}
                        {c.status === "sending" && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            In progress…
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
