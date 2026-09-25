/**
 * ============================================================================
 * MOBILE APP STORE LINKS — the single source of truth.
 * ============================================================================
 *
 * Both stores are live. To change a link, edit the `??` fallback below or set
 * the matching environment variable.
 *
 * Every "Get the app" button, footer badge and promo banner in the web app
 * reads from here. Nothing else in the codebase hardcodes a store URL.
 *
 * Two ways to set them, in order of precedence:
 *
 *   1. Environment (preferred for prod — no rebuild of the config needed,
 *      but note these are NEXT_PUBLIC_*, so they are inlined at build time):
 *        NEXT_PUBLIC_IOS_APP_URL=https://apps.apple.com/app/id0000000000
 *        NEXT_PUBLIC_ANDROID_APP_URL=https://play.google.com/store/apps/details?id=com.biopharmastock.app
 *
 *   2. The fallback string literals below.
 *
 * The placeholder mechanism below is kept for the case where a store link has
 * to be pulled temporarily (app removed, listing under review): set either URL
 * back to STORE_URL_PLACEHOLDER and that button disappears everywhere, with no
 * dead link left behind. If BOTH are placeholders, the promo banner and the
 * home-page section stop rendering entirely.
 *
 * The app's identifiers:
 *   iOS bundle id / Android package: com.biopharmastock.app
 *   Apple ID (App Store Connect → App Information → General): 6797457921
 */

/** Sentinel meaning "not published yet". Anything equal to this is hidden. */
export const STORE_URL_PLACEHOLDER = "TODO_SET_STORE_URL";

// Apple ID 6797457921. The link is deliberately written WITHOUT a storefront
// country code: App Store Connect hands you a regional link (ours came as
// .../jo/app/...), which pins every visitor to that one country's storefront —
// a Saudi or UAE visitor following it lands on the Jordan store. Omitting the
// code makes Apple redirect each visitor to their own storefront instead.
// To force a single storefront anyway, insert it back: apps.apple.com/jo/app/...
export const IOS_APP_URL =
  process.env.NEXT_PUBLIC_IOS_APP_URL ??
  "https://apps.apple.com/app/bio-pharma-stock/id6797457921";

// Google Play resolves the visitor's country from the request, so this URL
// needs no equivalent. `id` is the Android package from mobile/app.json.
export const ANDROID_APP_URL =
  process.env.NEXT_PUBLIC_ANDROID_APP_URL ??
  "https://play.google.com/store/apps/details?id=com.biopharmastock.app";

function isLive(url: string): boolean {
  return !!url && url !== STORE_URL_PLACEHOLDER && /^https?:\/\//.test(url);
}

export const hasIosApp = isLive(IOS_APP_URL);
export const hasAndroidApp = isLive(ANDROID_APP_URL);

/** True when at least one store link is real — gates the promo UI. */
export const hasAnyStoreLink = hasIosApp || hasAndroidApp;

/** The app's listing name, used in copy and structured data. */
export const APP_NAME = "Bio Pharma Stock";
