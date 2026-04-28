"use client";

import { useState, useEffect, useCallback } from "react";
import type { SignalHistory } from "@/types/signal";

export function useHistoryData() {
  const [historyData, setHistoryData] = useState<SignalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/history");
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistoryData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const refreshHistory = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { historyData, isLoading, error, refreshHistory, lastUpdated };
}
