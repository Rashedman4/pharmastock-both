"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  HeroPanel,
  SectionCard,
  StatCard,
  EmptyState,
  LoadingBlock,
} from "@/components/program/shared";
import { AdminPagination } from "@/components/admin/adminPagination";
import type { PaginationMeta } from "@/lib/mobile/paginate";
import { Download, Trash2, RefreshCw, AlertTriangle } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Overview {
  users: {
    total: number;
    new_7d: number;
    new_30d: number;
    admins: number;
    active_7d: number;
    active_30d: number;
    never_logged_in: number;
  };
  providers: { provider: string; count: number }[];
  logins: {
    ok_24h: number;
    ok_7d: number;
    failed_24h: number;
    unique_24h: number;
  };
  latestLogins: {
    id: number;
    user_id: number | null;
    email: string | null;
    name: string | null;
    client: string;
    method: string;
    success: boolean;
    failure_reason: string | null;
    ip: string | null;
    user_agent: string | null;
    created_at: string;
  }[];
  logs: {
    total: number;
    last_24h: number;
    oldest: string | null;
    newest: string | null;
    older_than_90d: number;
  };
}

interface LogRow {
  id: number;
  path: string;
  user_id: number | null;
  email: string | null;
  visited_at: string;
  country: string | null;
  region: string | null;
  ip: string | null;
  user_agent: string | null;
}

type Audience = "all" | "members" | "guests";
type PruneMode = "older_than" | "range" | "all";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const numberFmt = new Intl.NumberFormat("en-US");

function fmtNumber(n: number | null | undefined) {
  return typeof n === "number" ? numberFmt.format(n) : "—";
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

/** Turns a long UA string into something readable in a table cell. */
function shortUserAgent(ua: string | null) {
  if (!ua) return "—";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : null;
  const label = [os, browser].filter(Boolean).join(" · ");
  return label || ua.slice(0, 32);
}

const selectClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminMonitorPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Applied filters (what the table is showing).
  const [filters, setFilters] = useState({
    q: "",
    audience: "all" as Audience,
    country: "",
    from: "",
    to: "",
  });
  // Draft filters (what's in the inputs, before "Apply").
  const [draft, setDraft] = useState(filters);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [rows, setRows] = useState<LogRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [pruneOpen, setPruneOpen] = useState(false);
  const [pruneMode, setPruneMode] = useState<PruneMode>("older_than");
  const [pruneDays, setPruneDays] = useState("90");
  const [pruneFrom, setPruneFrom] = useState("");
  const [pruneTo, setPruneTo] = useState("");
  const [pruneConfirm, setPruneConfirm] = useState("");
  const [pruning, setPruning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  /** The applied filters as a query string — shared by the table and the CSV link. */
  const filterQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.q) p.set("q", filters.q);
    if (filters.audience !== "all") p.set("audience", filters.audience);
    if (filters.country) p.set("country", filters.country);
    if (filters.from) p.set("from", filters.from);
    // `to` is exclusive server-side; a date-only value should include that day.
    if (filters.to) p.set("to", `${filters.to}T23:59:59.999`);
    return p;
  }, [filters]);

  const loadOverview = useCallback(async () => {
    setOverviewError(null);
    try {
      const res = await fetch("/api/admin/monitor/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load overview.");
      setOverview(json);
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : "Failed to load overview.");
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    setLogsError(null);
    try {
      const p = new URLSearchParams(filterQuery);
      p.set("page", String(page));
      p.set("limit", String(limit));
      const res = await fetch(`/api/admin/monitor/logs?${p.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load logs.");
      setRows(json.rows);
      setPagination(json.pagination);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "Failed to load logs.");
      setRows([]);
      setPagination(null);
    } finally {
      setLoadingLogs(false);
    }
  }, [filterQuery, page, limit]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function applyFilters() {
    setPage(1);
    setFilters(draft);
  }

  function resetFilters() {
    const cleared = { q: "", audience: "all" as Audience, country: "", from: "", to: "" };
    setDraft(cleared);
    setFilters(cleared);
    setPage(1);
  }

  const pruneDescription = useMemo(() => {
    if (pruneMode === "all") return "every page-view row in the table";
    if (pruneMode === "range") {
      if (!pruneFrom || !pruneTo) return "the selected date range";
      return `rows from ${fmtDate(pruneFrom)} up to ${fmtDate(pruneTo)}`;
    }
    const days = Number(pruneDays);
    return Number.isFinite(days) && days > 0
      ? `rows older than ${days} days`
      : "rows older than the selected age";
  }, [pruneMode, pruneDays, pruneFrom, pruneTo]);

  const pruneReady =
    pruneConfirm === "DELETE" &&
    (pruneMode === "all" ||
      (pruneMode === "older_than" && Number(pruneDays) >= 1) ||
      (pruneMode === "range" && !!pruneFrom && !!pruneTo && pruneFrom < pruneTo));

  async function runPrune() {
    setPruning(true);
    setNotice(null);
    try {
      const body: Record<string, unknown> = { mode: pruneMode, confirm: "DELETE" };
      if (pruneMode === "older_than") body.days = Number(pruneDays);
      if (pruneMode === "range") {
        body.from = pruneFrom;
        body.to = `${pruneTo}T23:59:59.999`;
      }

      const res = await fetch("/api/admin/monitor/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to delete logs.");

      setNotice(`Deleted ${fmtNumber(json.deleted)} log rows. Reclaiming space in the background.`);
      setPruneOpen(false);
      setPruneConfirm("");
      setPage(1);
      await Promise.all([loadOverview(), loadLogs()]);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to delete logs.");
    } finally {
      setPruning(false);
    }
  }

  return (
    <div className="space-y-8">
      <HeroPanel
        badge="Monitor"
        title="Users, logins and traffic."
        description="Live counts from the users table, the login trail, and the page-view log. Filter and export the log, or prune it to reclaim database space."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              loadOverview();
              loadLogs();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {notice ? (
        <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
          {notice}
        </div>
      ) : null}

      {/* ---------------- Users ---------------- */}
      {overviewError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {overviewError}
        </div>
      ) : !overview ? (
        <LoadingBlock label="Loading overview..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total users"
              value={fmtNumber(overview.users.total)}
              hint={`${fmtNumber(overview.users.admins)} admin${overview.users.admins === 1 ? "" : "s"}`}
            />
            <StatCard
              label="New users (30d)"
              value={fmtNumber(overview.users.new_30d)}
              hint={`${fmtNumber(overview.users.new_7d)} in the last 7 days`}
            />
            <StatCard
              label="Active users (30d)"
              value={fmtNumber(overview.users.active_30d)}
              hint={`${fmtNumber(overview.users.active_7d)} in the last 7 days`}
            />
            <StatCard
              label="Never logged in"
              value={fmtNumber(overview.users.never_logged_in)}
              hint="Includes everyone who registered before login tracking started"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Logins (24h)"
              value={fmtNumber(overview.logins.ok_24h)}
              hint={`${fmtNumber(overview.logins.unique_24h)} distinct users`}
            />
            <StatCard label="Logins (7d)" value={fmtNumber(overview.logins.ok_7d)} />
            <StatCard
              label="Failed logins (24h)"
              value={fmtNumber(overview.logins.failed_24h)}
              hint="Wrong password, unknown email, or rate-limited"
            />
            <StatCard
              label="Page-view log"
              value={fmtNumber(overview.logs.total)}
              hint={`${fmtNumber(overview.logs.last_24h)} in the last 24h · oldest ${fmtDate(overview.logs.oldest)}`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <SectionCard
              title="Signup method"
              description="How the account was created."
            >
              {overview.providers.length === 0 ? (
                <p className="text-sm text-slate-500">No users yet.</p>
              ) : (
                <ul className="space-y-2">
                  {overview.providers.map((p) => (
                    <li
                      key={p.provider}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize text-slate-600">{p.provider}</span>
                      <span className="font-semibold text-slate-900">
                        {fmtNumber(p.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              className="lg:col-span-2"
              title="Latest logins"
              description="Most recent 25 attempts across web and mobile."
            >
              {overview.latestLogins.length === 0 ? (
                <EmptyState
                  title="No logins recorded yet"
                  description="Rows appear here as soon as someone signs in after migrations/auth_log.sql is applied."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-2 pr-4">User</th>
                        <th className="py-2 pr-4">Client</th>
                        <th className="py-2 pr-4">Method</th>
                        <th className="py-2 pr-4">Result</th>
                        <th className="py-2 pr-4">IP</th>
                        <th className="py-2">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview.latestLogins.map((l) => (
                        <tr key={l.id} className="align-top">
                          <td className="py-2 pr-4">
                            <div className="font-medium text-slate-900">
                              {l.name || l.email || "Unknown"}
                            </div>
                            {l.name && l.email ? (
                              <div className="text-xs text-slate-500">{l.email}</div>
                            ) : null}
                          </td>
                          <td className="py-2 pr-4 capitalize text-slate-600">{l.client}</td>
                          <td className="py-2 pr-4 capitalize text-slate-600">{l.method}</td>
                          <td className="py-2 pr-4">
                            {l.success ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                Success
                              </span>
                            ) : (
                              <span
                                className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                                title={l.failure_reason ?? undefined}
                              >
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-slate-600">{l.ip || "—"}</td>
                          <td className="whitespace-nowrap py-2 text-slate-600">
                            {fmtDateTime(l.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}

      {/* ---------------- Logs ---------------- */}
      <SectionCard
        title="Page-view log"
        description="Every client-side route change, written by /api/log."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={`/api/admin/monitor/logs/export?${filterQuery.toString()}`}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </a>
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => {
                setPruneOpen((v) => !v);
                setPruneConfirm("");
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete logs
            </Button>
          </div>
        }
      >
        {/* Filters */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Label htmlFor="log-q">Path or IP</Label>
            <Input
              id="log-q"
              value={draft.q}
              placeholder="/ar/signals or 51.36.8.41"
              onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </div>
          <div>
            <Label htmlFor="log-audience">Visitor</Label>
            <select
              id="log-audience"
              className={selectClass}
              value={draft.audience}
              onChange={(e) =>
                setDraft({ ...draft, audience: e.target.value as Audience })
              }
            >
              <option value="all">Everyone</option>
              <option value="members">Logged in</option>
              <option value="guests">Guests</option>
            </select>
          </div>
          <div>
            <Label htmlFor="log-from">From</Label>
            <Input
              id="log-from"
              type="date"
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="log-to">To</Label>
            <Input
              id="log-to"
              type="date"
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-2 lg:col-span-2">
            <Button onClick={applyFilters}>Apply</Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <select
              aria-label="Rows per page"
              className={`${selectClass} w-auto`}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={200}>200 / page</option>
            </select>
          </div>
        </div>

        {/* Prune panel */}
        {pruneOpen ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="w-full space-y-4">
                <div>
                  <p className="font-semibold text-red-800">Delete page-view logs</p>
                  <p className="text-sm text-red-700">
                    This permanently removes rows from <code>path_log</code> and cannot be
                    undone. Download the CSV first if you need a copy.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="prune-mode">What to delete</Label>
                    <select
                      id="prune-mode"
                      className={selectClass}
                      value={pruneMode}
                      onChange={(e) => setPruneMode(e.target.value as PruneMode)}
                    >
                      <option value="older_than">Older than N days</option>
                      <option value="range">A date range</option>
                      <option value="all">Everything</option>
                    </select>
                  </div>

                  {pruneMode === "older_than" ? (
                    <div>
                      <Label htmlFor="prune-days">Days to keep</Label>
                      <Input
                        id="prune-days"
                        type="number"
                        min={1}
                        max={3650}
                        value={pruneDays}
                        onChange={(e) => setPruneDays(e.target.value)}
                      />
                      {overview ? (
                        <p className="mt-1 text-xs text-red-700">
                          {fmtNumber(overview.logs.older_than_90d)} rows are currently older
                          than 90 days.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {pruneMode === "range" ? (
                    <>
                      <div>
                        <Label htmlFor="prune-from">From</Label>
                        <Input
                          id="prune-from"
                          type="date"
                          value={pruneFrom}
                          onChange={(e) => setPruneFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prune-to">To</Label>
                        <Input
                          id="prune-to"
                          type="date"
                          value={pruneTo}
                          onChange={(e) => setPruneTo(e.target.value)}
                        />
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="max-w-sm">
                  <Label htmlFor="prune-confirm">
                    Type DELETE to remove {pruneDescription}
                  </Label>
                  <Input
                    id="prune-confirm"
                    value={pruneConfirm}
                    placeholder="DELETE"
                    autoComplete="off"
                    onChange={(e) => setPruneConfirm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={!pruneReady || pruning}
                    onClick={runPrune}
                  >
                    {pruning ? "Deleting..." : "Delete permanently"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPruneOpen(false);
                      setPruneConfirm("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Table */}
        {logsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {logsError}
          </div>
        ) : loadingLogs ? (
          <LoadingBlock label="Loading logs..." />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No log rows match"
            description="Try widening the date range or clearing the filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Path</th>
                    <th className="py-2 pr-4">Visitor</th>
                    <th className="py-2 pr-4">Location</th>
                    <th className="py-2 pr-4">IP</th>
                    <th className="py-2">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-600">
                        {fmtDateTime(r.visited_at)}
                      </td>
                      <td className="py-2 pr-4 font-medium text-slate-900">{r.path}</td>
                      <td className="py-2 pr-4 text-slate-600">
                        {r.user_id ? (
                          <span title={`User #${r.user_id}`}>{r.email || `#${r.user_id}`}</span>
                        ) : (
                          <span className="text-slate-400">Guest</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        {[r.country, r.region].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{r.ip || "—"}</td>
                      <td className="py-2 text-slate-600" title={r.user_agent ?? undefined}>
                        {shortUserAgent(r.user_agent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination ? (
              <AdminPagination pagination={pagination} onPageChange={setPage} />
            ) : null}
          </>
        )}
      </SectionCard>
    </div>
  );
}
