"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
