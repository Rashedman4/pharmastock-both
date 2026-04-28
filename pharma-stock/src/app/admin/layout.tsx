import type { ReactNode } from "react";
import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/elite-applications", label: "Investor Applications" },
  { href: "/admin/elite-portfolios", label: "Investor Management" },
  { href: "/admin/firm-profit-payments", label: "Firm Payments" },
  { href: "/admin/bank-settings", label: "Bank Settings" },
  { href: "/admin/referrals", label: "Attribution Links" },
  { href: "/admin/signals", label: "Signals" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/history", label: "History" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/admin" className="text-2xl font-bold tracking-tight">BioPharmaStock Admin</Link>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/10">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
