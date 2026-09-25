"use client";

import {
  IOS_APP_URL,
  ANDROID_APP_URL,
  hasIosApp,
  hasAndroidApp,
} from "@/config/app-store";

/**
 * App Store / Google Play download buttons.
 *
 * The badges are drawn inline rather than loaded as images: Apple's and
 * Google's official badge artwork is licensed and must not be recoloured or
 * redrawn, so shipping a lookalike PNG would be worse than a clean custom
 * button. These are plainly our own buttons carrying each platform's logo,
 * which is what the guidelines allow. If you later drop the official badge
 * assets into /public, swap the <a> contents for an <Image>.
 *
 * A store whose URL is still a placeholder renders nothing — see
 * src/config/app-store.ts.
 */

type Lang = "en" | "ar";
type Variant = "light" | "dark";

const copy = {
  en: {
    iosTop: "Download on the",
    iosBottom: "App Store",
    androidTop: "Get it on",
    androidBottom: "Google Play",
    iosAria: "Download Bio Pharma Stock on the App Store",
    androidAria: "Get Bio Pharma Stock on Google Play",
  },
  ar: {
    iosTop: "حمّله من",
    iosBottom: "App Store",
    androidTop: "احصل عليه من",
    androidBottom: "Google Play",
    iosAria: "حمّل تطبيق Bio Pharma Stock من App Store",
    androidAria: "احصل على تطبيق Bio Pharma Stock من Google Play",
  },
} as const;

function AppleGlyph() {
  return (
    <svg viewBox="0 0 384 512" className="h-7 w-7 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 512 512" className="h-7 w-7 shrink-0" aria-hidden="true">
      <path fill="#00D4FF" d="M47.6 19.7C41.2 26.4 37.5 36.9 37.5 50.4v411.2c0 13.5 3.7 24 10.1 30.7l1.4 1.3L279.3 263v-5.4L49 27z" />
      <path fill="#FFCE00" d="m355.9 339.3-76.6-76.3v-5.4l76.7-76.4 1.7 1 90.8 51.6c25.9 14.7 25.9 38.8 0 53.6l-90.8 51.5z" />
      <path fill="#FF3A44" d="M357.6 338.3 279.3 260 47.6 492.3c8.5 9 22.6 10.1 38.5 1.1z" />
      <path fill="#00F076" d="M357.6 181.7 86.1 18.5C70.2 9.6 56.1 10.7 47.6 19.7L279.3 260z" />
    </svg>
  );
}

function Badge({
  href,
  ariaLabel,
  glyph,
  top,
  bottom,
  variant,
}: {
  href: string;
  ariaLabel: string;
  glyph: React.ReactNode;
  top: string;
  bottom: string;
  variant: Variant;
}) {
  const shell =
    variant === "dark"
      ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
      : "border-slate-800 bg-slate-900 text-white hover:bg-slate-800";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      // dir="ltr": the store names are latin wordmarks and must not be
      // re-ordered by the surrounding RTL context.
      dir="ltr"
      className={`inline-flex min-w-[10.5rem] items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${shell}`}
    >
      {glyph}
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[0.65rem] uppercase tracking-wide opacity-80">{top}</span>
        <span className="text-base font-semibold">{bottom}</span>
      </span>
    </a>
  );
}

export default function StoreBadges({
  lang = "en",
  variant = "light",
  className = "",
}: {
  lang?: Lang;
  variant?: Variant;
  className?: string;
}) {
  const t = copy[lang];

  if (!hasIosApp && !hasAndroidApp) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {hasIosApp ? (
        <Badge
          href={IOS_APP_URL}
          ariaLabel={t.iosAria}
          glyph={<AppleGlyph />}
          top={t.iosTop}
          bottom={t.iosBottom}
          variant={variant}
        />
      ) : null}
      {hasAndroidApp ? (
        <Badge
          href={ANDROID_APP_URL}
          ariaLabel={t.androidAria}
          glyph={<PlayGlyph />}
          top={t.androidTop}
          bottom={t.androidBottom}
          variant={variant}
        />
      ) : null}
    </div>
  );
}
