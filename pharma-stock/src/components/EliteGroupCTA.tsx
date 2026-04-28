"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Crown } from "lucide-react";

type Lang = "en" | "ar";

const translations = {
  en: {
    titleA: "Join the",
    titleB: "Elite Group",
    subtitle: "Private portfolio management for elite investors",
    cta: "Apply Now",
    trust: "Limited spots available • Application review required",
    href: "/en/elite-group",
  },
  ar: {
    titleA: "انضم إلى",
    titleB: "مجموعة إيليت",
    subtitle: "إدارة احترافية لمحفظتك الاستثمارية",
    cta: "قدّم الآن",
    trust: "الأماكن محدودة • يتطلب مراجعة الطلب",
    href: "/ar/elite-group",
  },
};

export default function EliteGroupCTA({ lang = "en" }: { lang?: Lang }) {
  const t = translations[lang];

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-gray-100 py-10 md:py-14"
    >
      {/* soft background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brightTeal/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-royalBlue/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="max-w-4xl mx-auto"
        >
          {/* gradient border shell */}
          <div className="rounded-2xl p-[1px] bg-gradient-to-r from-royalBlue/25 via-brightTeal/25 to-yellow-400/30 shadow-sm">
            <div className="rounded-2xl bg-gradient-to-br from-royalBlue via-royalBlue/95 to-brightTeal backdrop-blur-md border border-white/60">
              <div className="px-6 py-8 md:px-10 md:py-10 text-center">
                {/* icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08, duration: 0.45 }}
                  className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/15 border border-yellow-400/25"
                >
                  <Crown className="h-6 w-6 text-yellow-600" />
                </motion.div>

                {/* title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12, duration: 0.45 }}
                  className="text-2xl md:text-3xl font-extrabold text-pureWhite leading-tight"
                >
                  {t.titleA} <span className="text-yellow-600">{t.titleB}</span>
                </motion.h2>

                {/* subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.18, duration: 0.45 }}
                  className="mt-2 text-sm md:text-base text-pureWhite"
                >
                  {t.subtitle}
                </motion.p>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.24, duration: 0.45 }}
                  className="mt-6 flex items-center justify-center"
                >
                  <Link href={t.href}>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm md:text-base font-bold
                        bg-yellow-400 text-royalBlue shadow-md shadow-yellow-500/20
                        hover:bg-yellow-300 transition-all
                        ${lang === "ar" ? "flex-row-reverse" : ""}`}
                    >
                      <Crown className="h-5 w-5" />
                      <span>{t.cta}</span>
                      {/* tiny arrow-ish shine */}
                      <span className="ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    </motion.button>
                  </Link>
                </motion.div>

                {/* trust note */}
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.32, duration: 0.45 }}
                  className="mt-4 text-xs md:text-sm text-gray-300"
                >
                  {t.trust}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
