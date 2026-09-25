"use client";

import { motion } from "framer-motion";
import { BellRing, Newspaper, MessagesSquare, Languages } from "lucide-react";
import StoreBadges from "@/components/app/StoreBadges";
import { hasAnyStoreLink } from "@/config/app-store";

type Lang = "en" | "ar";

const translations = {
  en: {
    eyebrow: "Mobile app",
    title: "Get Bio Pharma Stock on your phone",
    subtitle:
      "Instant notifications the moment something moves — no refreshing, no waiting for an email.",
    features: [
      { icon: BellRing, label: "Instant push notifications" },
      { icon: Newspaper, label: "News, breakthroughs and daily updates" },
      { icon: MessagesSquare, label: "Talk to our team from the app" },
      { icon: Languages, label: "Full English and Arabic support" },
    ],
    free: "Free to download",
  },
  ar: {
    eyebrow: "تطبيق الجوال",
    title: "احصل على Bio Pharma Stock على هاتفك",
    subtitle:
      "إشعارات فورية في اللحظة التي يتحرك فيها أي شيء — دون تحديث الصفحة أو انتظار البريد الإلكتروني.",
    features: [
      { icon: BellRing, label: "إشعارات فورية على هاتفك" },
      { icon: Newspaper, label: "الأخبار والاختراقات والتحديثات اليومية" },
      { icon: MessagesSquare, label: "تواصل مع فريقنا من داخل التطبيق" },
      { icon: Languages, label: "دعم كامل للعربية والإنجليزية" },
    ],
    free: "التحميل مجاني",
  },
} as const;

/**
 * Home-page "Get the app" band. Renders nothing until at least one real store
 * link is configured (src/config/app-store.ts), so it is safe to ship before
 * the apps are approved.
 */
export default function GetTheAppSection({ lang = "en" }: { lang?: Lang }) {
  const t = translations[lang];
  const isArabic = lang === "ar";

  if (!hasAnyStoreLink) return null;

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-white py-10 md:py-14"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/4 h-72 w-72 rounded-full bg-brightTeal/10 blur-3xl" />
        <div className="absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-royalBlue/10 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-gradient-to-br from-royalBlue via-royalBlue/95 to-brightTeal p-[1px] shadow-sm"
        >
          <div className="rounded-2xl bg-gradient-to-br from-royalBlue via-royalBlue/95 to-brightTeal px-6 py-8 md:px-10 md:py-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brightTeal/90 md:text-sm">
              {t.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">{t.title}</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">{t.subtitle}</p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {t.features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <StoreBadges lang={lang} variant="dark" />
              <span className="text-xs text-white/70">{t.free}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
