"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";

type Status = "loading" | "error";

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-royalBlue/20 border-t-royalBlue" />
      <p className="text-sm text-slate-500">Signing you in…</p>
    </div>
  );
}

function HandoffContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const token = searchParams?.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    (async () => {
      const result = await signIn("mobile-handoff", { token, redirect: false });

      if (!result?.ok) {
        setStatus("error");
        return;
      }

      const session = await getSession();
      const redirectPath =
        (session as unknown as { handoffRedirect?: string })?.handoffRedirect ||
        "/en/elite-group/portfolio";

      try {
        document.cookie = "ps_mobile_handoff=1; Max-Age=1800; Path=/";
      } catch {
        // non-fatal — the "Return to App" banner is a cosmetic affordance only
      }

      window.location.href = redirectPath;
    })();
  }, [searchParams]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-base font-medium text-slate-700">
          This link has expired or was already used.
        </p>
        <a
          href="/en/auth/login"
          className="rounded-lg bg-royalBlue px-5 py-2.5 text-sm font-semibold text-white"
        >
          Go to login
        </a>
      </div>
    );
  }

  return <LoadingSpinner />;
}

export default function MobileHandoffPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HandoffContent />
    </Suspense>
  );
}
