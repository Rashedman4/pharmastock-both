"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

/**
 * The signed-in user's watchlist, shared by the stock search, the stock page
 * and the watchlist page.
 *
 * Guests get an empty list and `requireAuth()` instead of a request: the API
 * would answer 401 anyway, and the pages open the existing AuthModal.
 */

export interface WatchlistPrice {
  current_price: string | null;
  previous_close_price: string | null;
  change_amount: string | null;
  change_percent: string | null;
  currency: string | null;
  market_status: string | null;
  fetched_at: string | null;
}

export interface WatchlistRow {
  symbol: string;
  name_en: string;
  name_ar: string | null;
  alerts_enabled: boolean;
  created_at: string;
  price: WatchlistPrice | null;
}

const fetchWatchlist = async (url: string): Promise<WatchlistRow[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load watchlist");
  const payload = await res.json();
  return payload.data as WatchlistRow[];
};

/** Asks the always-mounted AuthModal to open. */
export function openAuthModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("openAuthModal"));
  }
}

export function useWatchlist() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const { data, error, isLoading, mutate } = useSWR<WatchlistRow[]>(
    isAuthenticated ? "/api/watchlist" : null,
    fetchWatchlist
  );

  const rows = data ?? [];
  const watched = new Set(rows.map((row) => row.symbol));

  const add = useCallback(
    async (symbol: string) => {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.code === "WATCHLIST_LIMIT" ? "limit" : "failed");
      }
      await mutate();
    },
    [mutate]
  );

  const remove = useCallback(
    async (symbol: string) => {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      await mutate();
    },
    [mutate]
  );

  const setAlerts = useCallback(
    async (symbol: string, alertsEnabled: boolean) => {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerts_enabled: alertsEnabled }),
      });
      if (!res.ok) throw new Error("failed");
      await mutate();
    },
    [mutate]
  );

  return {
    rows,
    watched,
    isAuthenticated,
    isLoading: isAuthenticated && isLoading,
    error,
    add,
    remove,
    setAlerts,
    mutate,
  };
}
