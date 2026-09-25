"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import { BellRing, X } from "lucide-react";
import StoreBadges from "@/components/app/StoreBadges";
import { hasAnyStoreLink } from "@/config/app-store";

/**
 * Dismissible "get the app" banner.
 *
 * Deliberately restrained, because this sits on every page:
 *   - it is a bottom banner, never a modal, so it never blocks the page;
 *   - it waits ~4s before appearing, so it doesn't collide with first paint
 *     or with PolicyModal (which is a real modal and must be dealt with first);
 *   - dismissal is remembered for 90 days in a cookie, and "already dismissed"
 *     is checked before the timer so a returning visitor never sees a flash;
 *   - it hides itself on /admin, the auth pages, the policy pages and /handoff,
 *     where it would be noise or would cover a form;
 *   - it renders nothing at all until a real store link is configured.
 *
 * Cookie rather than localStorage to match PolicyModal's `policyAccepted`,
 * which is the site's existing convention for this.
 */

const COOKIE_NAME = "appPromoDismissed";
const COOKIE_DAYS = 90;
const APPEAR_DELAY_MS = 4000;

const translations = {
  en: {
    title: "Get instant notifications on your phone",
    body: "Our free app alerts you the moment news, ideas, breakthroughs and daily updates land — plus chat with our team from anywhere.",
    dismiss: "Dismiss",
    notNow: "Not now",
  },
  ar: {
    title: "احصل على إشعارات فورية على هاتفك",
    body: "يُنبّهك تطبيقنا المجاني لحظة وصول الأخبار والأفكار والاختراقات والتحديثات اليومية — مع إمكانية محادثة فريقنا من أي مكان.",
    dismiss: "إغلاق",
    notNow: "ليس الآن",
  },
} as const;

/** Paths where the banner would be intrusive or out of place. */
function isSuppressedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/handoff") ||
    pathname.includes("/auth/") ||
    pathname.includes("/policy") ||
    pathname.includes("/privacy-policy") ||
    pathname.includes("/terms-of-service") ||
    pathname.includes("/delete-account")
  );
}

export default function AppPromoBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const lang: "en" | "ar" = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const t = translations[lang];
  const isArabic = lang === "ar";

  useEffect(() => {
    if (!hasAnyStoreLink) return;
    if (!pathname || isSuppressedPath(pathname)) {
      setVisible(false);
      return;
    }
    if (Cookies.get(COOKIE_NAME)) return;

    const timer = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  function dismiss() {
    Cookies.set(COOKIE_NAME, "1", { expires: COOKIE_DAYS, sameSite: "lax" });
    setVisible(false);
  }

  if (!hasAnyStoreLink) return null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          dir={isArabic ? "rtl" : "ltr"}
          role="complementary"
          aria-label={t.title}
          // pointer-events-none on the positioner + auto on the card so the
          // fixed wrapper never swallows clicks on the page behind it.
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-royalBlue text-white shadow-2xl">
            <div className="flex items-start gap-4 p-4 sm:p-5">
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brightTeal/20 text-brightTeal sm:inline-flex">
                <BellRing className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold sm:text-base">{t.title}</p>
                <p className="mt-1 text-xs text-white/75 sm:text-sm">
                  {t.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StoreBadges lang={lang} variant="dark" />
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-lg px-3 py-2 text-xs text-white/70 underline-offset-2 transition-colors hover:text-white hover:underline"
                  >
                    {t.notNow}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={dismiss}
                aria-label={t.dismiss}
                className="-m-1 shrink-0 rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
