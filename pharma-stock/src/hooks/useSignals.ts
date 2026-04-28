"use client";

import { useState, useEffect, useCallback } from "react";
import type { RawSignal } from "@/types/signal";

export function useSignals() {
  const [signals, setSignals] = useState<RawSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchSignals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/signals");
      if (!response.ok) throw new Error("Failed to fetch signals");
      const data = await response.json();
      setSignals(data);
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
    fetchSignals();
    // Refresh every 30 seconds to get updated prices
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const refreshSignals = useCallback(() => {
    fetchSignals();
  }, [fetchSignals]);

  return { signals, isLoading, error, refreshSignals, lastUpdated };
}
