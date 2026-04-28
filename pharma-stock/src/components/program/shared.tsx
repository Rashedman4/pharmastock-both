"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";

export type ProgramLang = "en" | "ar";

const STATUS_LABELS: Record<ProgramLang, Record<string, string>> = {
  en: {
    NONE: "None",
    UNKNOWN: "Unknown",
    NOT_SUBMITTED: "Not submitted",
    APPROVED: "Approved",
    ACTIVE: "Active",
    OPEN: "Open",
    EXECUTED: "Executed",
    ACCEPTED: "Accepted",
    ACCEPTED_BY_INVESTOR: "Accepted by investor",
    PENDING: "Pending",
    SENT: "Sent",
    PENDING_CLOSE: "Pending close",
    REJECTED: "Rejected",
    REJECTED_BY_INVESTOR: "Rejected by investor",
    CANCELLED: "Cancelled",
    SUSPENDED: "Suspended",
    CLOSED: "Closed",
    PAID: "Paid",
    REQUESTED: "Requested",
    AWAITING_TRANSFER: "Awaiting transfer",
    PROOF_SUBMITTED: "Proof submitted",
    UNDER_REVIEW: "Under review",
    CHECKOUT_CREATED: "Checkout created",
    INACTIVE: "Inactive",
  },
  ar: {
    NONE: "لا يوجد",
    UNKNOWN: "غير معروف",
    NOT_SUBMITTED: "لم يتم الإرسال",
    APPROVED: "تمت الموافقة",
    ACTIVE: "نشط",
    OPEN: "مفتوح",
    EXECUTED: "تم التنفيذ",
    ACCEPTED: "تم القبول",
    ACCEPTED_BY_INVESTOR: "تم القبول من المستثمر",
    PENDING: "قيد الانتظار",
    SENT: "تم الإرسال",
    PENDING_CLOSE: "بانتظار الإغلاق",
    REJECTED: "مرفوض",
    REJECTED_BY_INVESTOR: "مرفوض من المستثمر",
    CANCELLED: "ملغي",
    SUSPENDED: "موقوف",
    CLOSED: "مغلق",
    PAID: "تم الدفع",
    REQUESTED: "تم الطلب",
    AWAITING_TRANSFER: "بانتظار التحويل",
    PROOF_SUBMITTED: "تم إرسال الإثبات",
    UNDER_REVIEW: "قيد المراجعة",
    CHECKOUT_CREATED: "تم إنشاء رابط الدفع",
    INACTIVE: "غير نشط",
  },
};

export function money(value: number, lang: ProgramLang = "en") {
  return new Intl.NumberFormat(lang === "ar" ? "ar" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function shortDate(value?: string | null, lang: ProgramLang = "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(lang === "ar" ? "ar" : "en-US");
}

export function formatStatusLabel(
  status?: string | null,
  lang: ProgramLang = "en",
) {
  const normalized = String(status || "UNKNOWN")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
  return (
    STATUS_LABELS[lang][normalized] || status || STATUS_LABELS[lang].UNKNOWN
  );
}

export function statusTone(status?: string | null) {
  const normalized = String(status || "").toUpperCase();
  if (
    [
      "APPROVED",
      "ACTIVE",
      "OPEN",
      "EXECUTED",
      "ACCEPTED",
      "ACCEPTED_BY_INVESTOR",
      "PAID",
    ].includes(normalized)
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (["PENDING", "SENT", "PENDING_CLOSE", "REQUESTED", "AWAITING_TRANSFER", "PROOF_SUBMITTED", "UNDER_REVIEW", "CHECKOUT_CREATED"].includes(normalized)) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (
    [
      "REJECTED",
      "REJECTED_BY_INVESTOR",
      "CANCELLED",
      "SUSPENDED",
      "CLOSED",
    ].includes(normalized)
  ) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function StatusBadge({
  status,
  lang = "en",
}: {
  status?: string | null;
  lang?: ProgramLang;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(status)}`}
    >
      {formatStatusLabel(status, lang)}
    </span>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-slate-200 shadow-sm ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
          {description ? (
            <CardDescription className="mt-1 text-sm text-slate-500">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function HeroPanel({
  badge,
  title,
  description,
  actions,
  children,
  lang = "en",
}: {
  badge?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
  lang?: ProgramLang;
}) {
  const isArabic = lang === "ar";
  const hasChildren = Boolean(children);

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white shadow-xl"
    >
      <div
        className={[
          "grid gap-8 p-8 md:p-10",
          hasChildren
            ? isArabic
              ? "md:grid-cols-[1fr,1.4fr]"
              : "md:grid-cols-[1.4fr,1fr]"
            : "md:grid-cols-1",
        ].join(" ")}
      >
        <div
          className={[
            "space-y-5 max-w-3xl",
            isArabic ? "ml-auto text-right" : "mr-auto text-left",
            hasChildren && isArabic ? "md:order-2" : "",
          ].join(" ")}
        >
          {badge ? (
            <div className={isArabic ? "w-fit ml-auto" : "w-fit"}>
              <Badge className="border-0 bg-white/10 text-white hover:bg-white/10">
                {badge}
              </Badge>
            </div>
          ) : null}

          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              {title}
            </h1>
            <p
              className={`text-sm text-slate-200 md:text-base ${
                isArabic ? "mr-0" : "max-w-2xl"
              }`}
            >
              {description}
            </p>
          </div>

          {actions ? (
            <div
              className={`flex w-fit flex-wrap gap-3 ${isArabic ? "ml-auto" : ""}`}
            >
              {actions}
            </div>
          ) : null}
        </div>

        {hasChildren ? (
          <div
            className={[
              "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur",
              isArabic ? "text-right md:order-1" : "text-left",
            ].join(" ")}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Card className="border-dashed border-slate-300 bg-slate-50">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <ShieldAlert className="h-8 w-8 text-slate-400" />
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {ctaHref && ctaLabel ? (
          <Button asChild>
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel,
}: {
  value?: string | null;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const disabled = !value;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      <Copy className="h-4 w-4" />
      {copied ? copiedLabel || "Copied" : label}
    </Button>
  );
}

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function InfoList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {item.label}
          </p>
          <div className="mt-2 text-sm font-medium text-slate-900">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PillList({ items }: { items: string[] }) {
  const unique = useMemo(
    () => Array.from(new Set(items.filter(Boolean))),
    [items],
  );
  return (
    <div className="flex flex-wrap gap-2">
      {unique.map((item) => (
        <span
          key={item}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function RoleTimeline({
  items,
  lang = "en",
  embedded = false,
}: {
  items: { title: string; description: string }[];
  lang?: ProgramLang;
  embedded?: boolean;
}) {
  const isArabic = lang === "ar";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={
        embedded
          ? ""
          : "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
      }
    >
      <div className="space-y-4">
        {items.map((item, index) => {
          const stepNumber = `${new Intl.NumberFormat(
            isArabic ? "ar" : "en-US",
          ).format(index + 1)}.`;

          return (
            <div
              key={item.title}
              className={`flex items-start gap-4 ${
                isArabic ? "flex-row-reverse text-right" : ""
              }`}
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
                <Clock3 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                {isArabic ? (
                  <div className="flex flex-row-reverse items-start justify-end gap-2">
                    <p className="text-sm font-semibold leading-6 text-white">
                      {item.title}
                    </p>
                    <span className="shrink-0 text-white/60">{stepNumber}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 text-white/60">{stepNumber}</span>
                    <p className="text-sm font-semibold leading-6 text-white">
                      {item.title}
                    </p>
                  </div>
                )}

                <p className="text-sm leading-6 text-slate-200">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function ProgramSectionNav({
  section,
  lang = "en",
}: {
  section: "elite" | "partner";
  lang?: ProgramLang;
}) {
  const pathname = usePathname();
  const [status, setStatus] = useState<string>("NONE");
  const base = `/${lang}`;
  const isArabic = lang === "ar";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const endpoint =
          section === "partner" ? "/api/partners/me" : "/api/elite/status";
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setStatus("NONE");
          return;
        }
        const json = await res.json();
        if (!cancelled) setStatus(String(json?.status || "NONE").toUpperCase());
      } catch {
        if (!cancelled) setStatus("NONE");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [section]);

  const labels = {
    en: {
      overview: "Overview",
      dashboard: "Dashboard",
      clients: "Clients",
      apply: "Apply",
      plans: "Plans",
      portfolio: "Portfolio",
    },
    ar: {
      overview: "نظرة عامة",
      dashboard: "لوحة التحكم",
      clients: "العملاء",
      apply: "التقديم",
      plans: "الخطط",
      portfolio: "المحفظة",
    },
  } as const;

  const items =
    section === "partner"
      ? [
          {
            href: `${base}/partners`,
            label: labels[lang].overview,
            show: true,
            exact: true,
          },
          {
            href: `${base}/partners/dashboard`,
            label: labels[lang].dashboard,
            show: status !== "NONE",
          },
          {
            href: `${base}/partners/clients`,
            label: labels[lang].clients,
            show: status === "APPROVED",
          },
          {
            href: `${base}/partners/apply`,
            label: labels[lang].apply,
            show: !["APPROVED"].includes(status),
          },
        ]
      : [
          {
            href: `${base}/elite-group`,
            label: labels[lang].overview,
            show: true,
            exact: true,
          },
          {
            href: `${base}/elite-group/dashboard`,
            label: labels[lang].dashboard,
            show: status === "APPROVED",
          },
          {
            href: `${base}/elite-group/plan`,
            label: labels[lang].plans,
            show: status === "APPROVED",
          },
          {
            href: `${base}/elite-group/portfolio`,
            label: labels[lang].portfolio,
            show: status === "APPROVED",
          },
        ];

  const visibleItems = items.filter((item) => item.show);

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-2 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 justify-start">
        {visibleItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-blue-700 text-white shadow"
                  : "text-blue-800 hover:bg-blue-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DecisionIcon({ status }: { status?: string | null }) {
  const normalized = String(status || "").toUpperCase();
  if (
    [
      "APPROVED",
      "ACTIVE",
      "OPEN",
      "EXECUTED",
      "ACCEPTED",
      "ACCEPTED_BY_INVESTOR",
    ].includes(normalized)
  ) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  }
  if (["REJECTED", "REJECTED_BY_INVESTOR", "SUSPENDED"].includes(normalized)) {
    return <XCircle className="h-4 w-4 text-rose-600" />;
  }
  return <Clock3 className="h-4 w-4 text-amber-600" />;
}
