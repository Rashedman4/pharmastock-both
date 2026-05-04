"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import useSWR from "swr";
import { Send, Plus, Users, X, MessageCircle, ChevronDown, Image as ImageIcon, Mic, Square } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SendPayload = {
  content?: string;
  messageType: "text" | "image" | "voice";
  attachmentUrl?: string;
  attachmentMetadata?: Record<string, unknown>;
};

type AttachmentState = {
  type: "image" | "voice";
  preview: string;
  uploading: boolean;
  error?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

type Group = {
  id: string;
  name: string;
  audience_type: string;
  custom_user_ids: number[];
  message_count: number;
  last_sent_at: string | null;
  created_at: string;
};

type GroupMessage = {
  id: string;
  content: string | null;
  message_type: string;
  attachment_url: string | null;
  attachment_metadata: Record<string, unknown> | null;
  status: string;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
};

type AdminConversation = {
  id: string;
  user_id: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  admin_unread_count: number;
  user_unread_count: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
};

type RawMessage = {
  id: string;
  conversation_id: string;
  sender_type: "admin" | "user";
  message_type: string;
  content: string | null;
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
};

type UserItem = { id: number; email: string; firstname: string | null; lastname: string | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const AUDIENCE_LABELS: Record<string, string> = {
  all_users: "All Users", elite_users: "Elite", subscription_users: "Subscribers", custom: "Custom",
};
const AUDIENCE_COLORS: Record<string, string> = {
  all_users: "bg-blue-100 text-blue-700", elite_users: "bg-amber-100 text-amber-700",
  subscription_users: "bg-purple-100 text-purple-700", custom: "bg-slate-200 text-slate-700",
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1) return "now";
  if (d < 60) return `${d}m`;
  if (d < 1440) return `${Math.floor(d / 60)}h`;
  return new Date(iso).toLocaleDateString();
}

function userName(c: AdminConversation) {
  return [c.firstname, c.lastname].filter(Boolean).join(" ") || c.email.split("@")[0];
}
function initials(c: AdminConversation) {
  return userName(c).slice(0, 2).toUpperCase();
}
function fmtSecs(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Media bubble renderer ────────────────────────────────────────────────────

function MediaBubble({
  messageType,
  content,
  attachmentUrl,
  isAdmin,
}: {
  messageType: string;
  content: string | null;
  attachmentUrl: string | null;
  isAdmin: boolean;
}) {
  const textColor = isAdmin ? "text-white" : "text-slate-800";
  const captionColor = isAdmin ? "text-teal-100" : "text-slate-500";

  if (messageType === "image" && attachmentUrl) {
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachmentUrl}
          alt="Image"
          className="max-w-xs rounded-lg"
          style={{ maxHeight: 280 }}
        />
        {content && <p className={`mt-1.5 text-sm whitespace-pre-wrap ${captionColor}`}>{content}</p>}
      </div>
    );
  }

  if (messageType === "voice" && attachmentUrl) {
    return (
      <div>
        {/* Native audio element — works in all browsers */}
        <audio
          controls
          src={attachmentUrl}
          className="max-w-xs rounded-lg"
          style={{ height: 36, minWidth: 200 }}
        />
        {content && <p className={`mt-1 text-xs ${captionColor}`}>{content}</p>}
      </div>
    );
  }

  if (content) {
    return <p className={`whitespace-pre-wrap text-sm leading-relaxed ${textColor}`}>{content}</p>;
  }

  return <p className={`text-sm italic opacity-60 ${textColor}`}>[{messageType}]</p>;
}

// ─── New Group Form ────────────────────────────────────────────────────────────

function NewGroupForm({ onCreated, onCancel }: { onCreated: (g: Group) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [audienceType, setAudienceType] = useState<"all_users" | "elite_users" | "subscription_users" | "custom">("all_users");
  const [customUserIds, setCustomUserIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audienceType === "custom" && !usersLoaded) {
      fetch("/api/admin/mobile/users?limit=1000").then((r) => r.json()).then((d) => { setUsers(d.data ?? []); setUsersLoaded(true); });
    }
  }, [audienceType, usersLoaded]);

  const filtered = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return !q ? users : users.filter((u) => u.email.toLowerCase().includes(q) || `${u.firstname ?? ""} ${u.lastname ?? ""}`.toLowerCase().includes(q));
  }, [users, userSearch]);

  const toggle = (id: number) => setCustomUserIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) return setError("Group name is required");
    if (audienceType === "custom" && !customUserIds.length) return setError("Select at least one user");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mobile/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), audienceType, customUserIds }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onCreated(data);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">New Group</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>
      {error && <p className="mb-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>}
      <input className="w-full mb-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="w-full mb-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" value={audienceType} onChange={(e) => { setAudienceType(e.target.value as typeof audienceType); setCustomUserIds([]); }}>
        <option value="all_users">All Users</option>
        <option value="elite_users">Elite Members</option>
        <option value="subscription_users">Subscribers</option>
        <option value="custom">Custom — pick users</option>
      </select>
      {audienceType === "custom" && (
        <div className="mb-3">
          <input className="w-full mb-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
          <div className="max-h-40 overflow-y-auto rounded border border-slate-200 bg-white divide-y text-xs">
            {!usersLoaded ? <p className="p-2 text-slate-400">Loading...</p> : filtered.map((u) => (
              <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={customUserIds.includes(u.id)} onChange={() => toggle(u.id)} className="h-3.5 w-3.5 rounded" />
                <span className="truncate text-slate-700">{u.firstname} {u.lastname} <span className="text-slate-400">({u.email})</span></span>
              </label>
            ))}
          </div>
          {customUserIds.length > 0 && <p className="mt-1 text-xs text-teal-600 font-medium">{customUserIds.length} selected</p>}
        </div>
      )}
      <button onClick={handleCreate} disabled={saving} className="w-full rounded-md bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
        {saving ? "Creating..." : "Create Group"}
      </button>
    </div>
  );
}

// ─── Message Input (text + image + voice) ─────────────────────────────────────

function MessageInput({
  placeholder,
  onSend,
  disabled,
}: {
  placeholder: string;
  onSend: (payload: SendPayload) => Promise<void>;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<AttachmentState | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef    = useRef<HTMLInputElement>(null);
  const recRef     = useRef<MediaRecorder | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const textaRef   = useRef<HTMLTextAreaElement>(null);

  // Upload helper
  const doUpload = useCallback(async (file: File): Promise<{ url: string; metadata: Record<string, unknown> }> => {
    const form = new FormData();
    form.append("file", file);
    const res  = await fetch("/api/admin/mobile/uploads", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return { url: data.url, metadata: { size: data.size, duration: data.duration, width: data.width, height: data.height } };
  }, []);

  // Image picker
  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const preview = URL.createObjectURL(file);
    setAttachment({ type: "image", preview, uploading: true });
    setError(null);
    try {
      const { url, metadata } = await doUpload(file);
      setAttachment((p) => p ? { ...p, uploading: false, url, metadata } : null);
    } catch (err: unknown) {
      setAttachment(null);
      setError(err instanceof Error ? err.message : "Image upload failed");
    }
  }, [doUpload]);

  // Voice recording
  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recRef.current    = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (!chunksRef.current.length) return;
        const mimeType = recorder.mimeType || "audio/webm";
        const ext      = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : "webm";
        const blob     = new Blob(chunksRef.current, { type: mimeType });
        const file     = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
        const preview  = URL.createObjectURL(blob);
        setAttachment({ type: "voice", preview, uploading: true });
        setRecording(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        try {
          const { url, metadata } = await doUpload(file);
          setAttachment((p) => p ? { ...p, uploading: false, url, metadata } : null);
        } catch (err: unknown) {
          setAttachment(null);
          setError(err instanceof Error ? err.message : "Voice upload failed");
        }
      };

      recorder.start(250);
      setRecording(true);
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone in your browser.");
    }
  }, [doUpload]);

  const stopRecording = useCallback(() => {
    recRef.current?.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const clearAttachment = useCallback(() => {
    if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
    setAttachment(null);
  }, [attachment]);

  const handleSend = useCallback(async () => {
    if (sending || disabled) return;
    if (attachment?.uploading) { setError("Please wait — still uploading…"); return; }

    let payload: SendPayload;
    if (attachment?.url) {
      payload = { content: text.trim() || undefined, messageType: attachment.type, attachmentUrl: attachment.url, attachmentMetadata: attachment.metadata };
    } else if (text.trim()) {
      payload = { content: text.trim(), messageType: "text" };
    } else {
      return;
    }

    const savedText = text;
    const savedAtt  = attachment;
    setText("");
    setAttachment(null);
    setSending(true);
    setError(null);
    try {
      await onSend(payload);
    } catch (e: unknown) {
      setText(savedText);
      setAttachment(savedAtt);
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
      textaRef.current?.focus();
    }
  }, [sending, disabled, attachment, text, onSend]);

  const canSend = !sending && !disabled && !attachment?.uploading &&
    (attachment?.url !== undefined || text.trim().length > 0);

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">

      {/* Attachment preview strip */}
      {(recording || attachment) && (
        <div className="mb-2">
          {/* Recording indicator */}
          {recording && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-700">Recording… {fmtSecs(recSecs)}</span>
              <button onClick={stopRecording} className="ml-auto flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-200">
                <Square className="h-3 w-3 fill-current" /> Stop
              </button>
            </div>
          )}

          {/* Image preview */}
          {!recording && attachment?.type === "image" && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700">Image attached</p>
                {attachment.uploading && <p className="text-xs text-slate-400">Uploading…</p>}
                {attachment.error && <p className="text-xs text-red-500">{attachment.error}</p>}
              </div>
              {attachment.uploading
                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                : <span className="text-xs text-teal-600 font-medium">✓ Ready</span>
              }
              <button onClick={clearAttachment} className="text-slate-400 hover:text-slate-600 ml-1"><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Voice note preview */}
          {!recording && attachment?.type === "voice" && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5">
              <Mic className="h-5 w-5 shrink-0 text-teal-600" />
              {attachment.uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
                  <span className="text-xs text-slate-500">Uploading voice note…</span>
                </>
              ) : attachment.url ? (
                <audio src={attachment.preview} controls className="flex-1 h-8" />
              ) : (
                <span className="flex-1 text-xs text-slate-500">Voice note ready</span>
              )}
              {!attachment.uploading && <span className="text-xs text-teal-600 font-medium">✓</span>}
              <button onClick={clearAttachment} className="text-slate-400 hover:text-slate-600 ml-1"><X className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="mb-1 text-xs text-red-500">{error}</p>}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Image picker button */}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={recording || !!attachment || disabled}
          title="Attach image"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-teal-600 disabled:opacity-30 transition-colors"
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        {/* Mic button */}
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={!!attachment || disabled}
          title={recording ? "Stop recording" : "Record voice note"}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 ${
            recording ? "bg-red-100 text-red-500 hover:bg-red-200" : "text-slate-400 hover:bg-slate-100 hover:text-teal-600"
          }`}
        >
          {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Text area */}
        <textarea
          ref={textaRef}
          rows={1}
          disabled={recording}
          className="flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-40"
          placeholder={attachment ? "Add a caption (optional)…" : placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:opacity-40 transition-colors"
        >
          {sending
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </div>
    </div>
  );
}

// ─── Scroll-to-bottom ─────────────────────────────────────────────────────────

function useScrollBottom(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [dep]);
  return ref;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "groups" | "dms";

export default function AdminMessagesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("groups");

  // ── Groups ──────────────────────────────────────────────────────────────────
  const { data: groupsData, mutate: mutateGroups } = useSWR("/api/admin/mobile/groups", fetcher, { refreshInterval: 5000 });
  const groups: Group[] = groupsData?.data ?? [];
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  const { data: groupMsgsData, mutate: mutateGroupMsgs } = useSWR(
    selectedGroupId ? `/api/admin/mobile/groups/${selectedGroupId}/messages` : null,
    fetcher, { refreshInterval: 3000 }
  );
  const groupMessages: GroupMessage[] = groupMsgsData?.data ?? [];
  const groupEndRef = useScrollBottom(groupMessages.length);

  // ── DMs ─────────────────────────────────────────────────────────────────────
  const { data: convsData, mutate: mutateConvs } = useSWR("/api/admin/mobile/conversations", fetcher, { refreshInterval: 3000 });
  const conversations: AdminConversation[] = convsData?.data ?? [];
  const totalUnread = conversations.reduce((s, c) => s + (c.admin_unread_count ?? 0), 0);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const { data: convDetailData, mutate: mutateConvDetail } = useSWR(
    selectedConvId ? `/api/admin/mobile/conversations/${selectedConvId}` : null,
    fetcher, { refreshInterval: 3000 }
  );
  const convMessages: RawMessage[] = convDetailData?.messages ?? [];
  const convInfo = convDetailData?.conversation as (AdminConversation & { firstname: string; lastname: string }) | undefined;
  const convEndRef = useScrollBottom(convMessages.length);

  // ── Senders ─────────────────────────────────────────────────────────────────
  const handleGroupSend = async (payload: SendPayload) => {
    const res  = await fetch(`/api/admin/mobile/groups/${selectedGroupId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to send");
    mutateGroupMsgs(); mutateGroups();
  };

  const handleDmSend = async (payload: SendPayload) => {
    const res  = await fetch(`/api/admin/mobile/conversations/${selectedConvId}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to send");
    mutateConvDetail(); mutateConvs();
  };

  const handleGroupCreated = (group: Group) => {
    mutateGroups();
    setShowNewGroupForm(false);
    setSelectedGroupId(group.id);
  };

  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ height: "calc(100vh - 88px)", minHeight: 500 }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        {/* Tabs */}
        <div className="flex shrink-0 border-b border-slate-200">
          {(["groups", "dms"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
                activeTab === tab ? "border-b-2 border-teal-500 text-teal-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "groups" ? <Users className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
              {tab === "groups" ? "Groups" : "Direct Messages"}
              {tab === "dms" && totalUnread > 0 && (
                <span className="absolute right-2 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Groups list */}
        {activeTab === "groups" && (
          <>
            <div className="flex shrink-0 items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Groups</span>
              <button onClick={() => setShowNewGroupForm((v) => !v)} className="flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-700">
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
            {showNewGroupForm && <NewGroupForm onCreated={handleGroupCreated} onCancel={() => setShowNewGroupForm(false)} />}
            <div className="flex-1 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="px-4 py-8 text-center"><Users className="mx-auto mb-2 h-7 w-7 text-slate-300" /><p className="text-xs text-slate-400">No groups yet.</p></div>
              ) : groups.map((g) => (
                <button key={g.id} onClick={() => setSelectedGroupId(g.id)}
                  className={`w-full px-3 py-3 text-left hover:bg-slate-100 transition-colors ${selectedGroupId === g.id ? "border-l-2 border-teal-500 bg-teal-50/60" : "border-l-2 border-transparent"}`}>
                  <div className="flex items-start justify-between">
                    <span className="truncate text-sm font-semibold text-slate-800">{g.name}</span>
                    {g.last_sent_at && <span className="ml-1 shrink-0 text-xs text-slate-400">{timeAgo(g.last_sent_at)}</span>}
                  </div>
                  <div className="mt-0.5 flex gap-1.5">
                    <span className={`rounded-full px-1.5 text-xs font-medium ${AUDIENCE_COLORS[g.audience_type]}`}>{AUDIENCE_LABELS[g.audience_type]}</span>
                    {g.message_count > 0 && <span className="text-xs text-slate-400">{g.message_count} msg{g.message_count !== 1 ? "s" : ""}</span>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* DMs list */}
        {activeTab === "dms" && (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="px-4 py-8 text-center"><MessageCircle className="mx-auto mb-2 h-7 w-7 text-slate-300" /><p className="text-xs text-slate-400">No replies yet. Send a group message first.</p></div>
            ) : conversations.map((c) => (
              <button key={c.id} onClick={() => setSelectedConvId(c.id)}
                className={`w-full px-3 py-3 text-left hover:bg-slate-100 transition-colors ${selectedConvId === c.id ? "border-l-2 border-teal-500 bg-teal-50/60" : "border-l-2 border-transparent"}`}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-700">{initials(c)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className="truncate text-sm font-semibold text-slate-800">{userName(c)}</span>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        {c.last_message_at && <span className="text-xs text-slate-400">{timeAgo(c.last_message_at)}</span>}
                        {c.admin_unread_count > 0 && (
                          <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">{c.admin_unread_count}</span>
                        )}
                      </div>
                    </div>
                    {c.last_message_preview && <p className="truncate text-xs text-slate-400">{c.last_message_preview}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Groups chat panel */}
        {activeTab === "groups" && (
          !selectedGroup ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Users className="h-12 w-12 text-slate-200" />
              <div><p className="text-base font-semibold text-slate-500">Select a group</p><p className="mt-1 text-sm text-slate-400">Messages go to every member&apos;s private inbox instantly.</p></div>
            </div>
          ) : (
            <>
              {/* Group header */}
              <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100"><Users className="h-4 w-4 text-teal-600" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{selectedGroup.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <span className={`rounded-full px-1.5 text-xs font-medium ${AUDIENCE_COLORS[selectedGroup.audience_type]}`}>{AUDIENCE_LABELS[selectedGroup.audience_type]}</span>
                    · messages sent to each user&apos;s private DM
                  </p>
                </div>
              </div>

              {/* Group messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {groupMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center"><p className="text-sm text-slate-400">No messages yet — send text, images, or voice notes below.</p></div>
                ) : (
                  groupMessages.map((m) => (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-lg">
                        <div className="rounded-2xl rounded-br-sm bg-teal-600 px-4 py-2.5 shadow-sm">
                          <MediaBubble messageType={m.message_type} content={m.content} attachmentUrl={m.attachment_url} isAdmin={true} />
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-2 px-1">
                          <span className="text-xs text-slate-400">{new Date(m.sent_at ?? m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {m.recipient_count > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-teal-600">
                              <ChevronDown className="h-3 w-3" />{m.recipient_count} delivered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={groupEndRef} />
              </div>

              <MessageInput placeholder={`Message ${selectedGroup.name}…`} onSend={handleGroupSend} />
            </>
          )
        )}

        {/* DM chat panel */}
        {activeTab === "dms" && (
          !selectedConvId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <MessageCircle className="h-12 w-12 text-slate-200" />
              <div><p className="text-base font-semibold text-slate-500">Select a conversation</p><p className="mt-1 text-sm text-slate-400">User replies from your group messages appear here.</p></div>
            </div>
          ) : (
            <>
              {/* DM header */}
              {convInfo && (
                <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700">{initials(convInfo)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{[convInfo.firstname, convInfo.lastname].filter(Boolean).join(" ") || convInfo.email}</p>
                    <p className="text-xs text-slate-400">{convInfo.email}</p>
                  </div>
                </div>
              )}

              {/* DM messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {convMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center"><p className="text-sm text-slate-400">No messages yet.</p></div>
                ) : (
                  convMessages.map((m) => {
                    const isAdmin = m.sender_type === "admin";
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        {!isAdmin && (
                          <div className="mr-2 mb-1 flex h-7 w-7 shrink-0 self-end items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-600">
                            {convInfo ? initials(convInfo) : "?"}
                          </div>
                        )}
                        <div className="max-w-lg">
                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${isAdmin ? "rounded-br-sm bg-teal-600" : "rounded-bl-sm border border-slate-200 bg-white"}`}>
                            <MediaBubble messageType={m.message_type} content={m.content} attachmentUrl={m.attachment_url} isAdmin={isAdmin} />
                          </div>
                          <p className={`mt-1 px-1 text-xs text-slate-400 ${isAdmin ? "text-right" : "text-left"}`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {m.read_at && isAdmin && <span className="ml-1 text-teal-500">· seen</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={convEndRef} />
              </div>

              <MessageInput placeholder="Reply privately…" onSend={handleDmSend} />
            </>
          )
        )}
      </div>
    </div>
  );
}
