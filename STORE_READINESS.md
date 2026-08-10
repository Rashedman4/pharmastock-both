# App Store / Play Store Readiness Report — `./mobile`

Prepared ahead of resubmission. Read-only review — no code was modified while producing this report.

Legend: **Blocker** = would likely cause rejection · **Warning** = risky, reviewer-dependent · **Suggestion** = good practice, not required.

---

## Remediation status (as of 2026-07-26)

The findings below were reviewed and triaged item-by-item from the Prioritized Checklist. Fixes for the approved items have already been applied to the codebase (this file was **not** updated to remove the original findings — they're kept as-written for historical record; this section tracks what's actually been done since).

**Fixed (checklist #1, 4, 5, 6, 8, 9, 10, 11, 14, 16, 17, plus two follow-ups on #18):**
- **#1** payment-handoff copy/disclosure — `elite.pay_now`/`pay_now_hint` reworded away from "Pay Now" (both languages); `payments.tsx`'s `handlePayNow` now shows a confirm `Alert` ("Real-World Payment" / real-world transfer, not a purchase) before opening the browser.
- **#4** emoji regression — removed `⭐` and `⚙️` from `profile.tsx`'s Elite/Settings rows, replaced with `Ionicons` (`star`, `settings-outline`); dead `eliteIcon` text style removed.
- **#5** risk disclaimer — added a visible disclosure box to `elite/apply.tsx` (new `risk_disclaimer_title`/`risk_disclaimer_body` keys, both languages): not investment advice, past performance ≠ future results, capital at risk.
- **#6** Terms of Service — net-new page: `pharma-stock/src/components/app/MobileTermsOfService.tsx` + `src/app/en/terms-of-service/page.tsx` + `src/app/ar/terms-of-service/page.tsx` (mirrors the existing Privacy Policy page exactly, public route). Linked from mobile Settings next to Privacy Policy.
- **#8** conflicting camera/photo permission strings — removed the `expo-image-picker` plugin's own `cameraPermission`/`photosPermission` overrides in `app.json`; the plugin now falls back to the accurate top-level `NSCameraUsageDescription`/`NSPhotoLibraryUsageDescription` strings instead of its generic defaults.
- **#9** push-permission explainer — `registerForPushNotifications()` now shows a one-time `Alert` before the native OS prompt, but only when `existingStatus === 'undetermined'` (i.e. once, ever, per install).
- **#10** unused Android permission — removed `RECEIVE_BOOT_COMPLETED` from `app.json` after confirming (via full-repo grep) no boot-triggered logic exists anywhere in the app.
- **#11** sensitive `console.log`s — gated the two flagged logs behind `if (__DEV__)` rather than deleting outright, so they still fire in local/dev builds but are inert in what ships: the full Expo push token (`lib/notifications.ts`) and the raw Google OAuth error JSON (`login.tsx`). Other console usage in the app (socket status, i18n fallback, chat upload errors) doesn't leak anything and was left alone.
- **#14** dead `delete_account_subtitle` key — `SettingsRow` now accepts/renders an optional `subtitle`; wired into the Delete Account row so it actually shows.
- **#16** hardcoded English-only error strings — `daily-updates/[id].tsx`'s error state now uses `t('common.error')`/`t('common.back')`, matching the sibling `breakthroughs/[id].tsx` pattern exactly.
- **#17** `$100,000` → `$50,000` — fixed in `elite.invest_min` and `elite.not_elite_body`, both locale files (these two keys turned out to be currently unreferenced in the app, same as #14 was before its fix — corrected the value anyway since it's the accurate one regardless).
- **#18 follow-up (two efficient mitigations, beyond the original "cosmetic, no fix needed" call):**
  - Bumped the mobile→web payment handoff token's TTL from 2 minutes to 30 minutes (`elite/payment-handoff/route.ts`) for more slack on slow devices/networks before the (still single-use) token is redeemed.
  - `ElitePortfolioPage.tsx`: when a Stripe firm-profit payment completes successfully **and** the user arrived via the mobile handoff (existing `ps_mobile_handoff` cookie), the page now shows the success confirmation for ~1.8s, then automatically fires the same `pharmastock://elite/payments` deep link the pre-existing manual "Return to App" button already used — proactively handing control back to the native app on Android instead of relying on the user to notice and tap the button. The manual button remains as a fallback.
- Verified after every change: `mobile`'s `tsc --noEmit` clean, `pharma-stock`'s `tsc --noEmit` clean, `pharma-stock`'s `npm run build` clean (new ToS routes prerender as static alongside the existing privacy-policy pages), `app.json`/both locale JSON files parse validly.

**Explained, not code-fixed (user asked for clarification rather than a change):**
- **#2** no demo/reviewer path into Elite gated content — not fixable in code (a fresh reviewer account can never pass the real `is_elite_member`/`APPROVED` check, by design). Needs a seeded demo `elite_members` account with sample portfolio/plan data, handed to Apple/Google reviewers via their notes fields. A self-contained brief for this was written and handed off for a later decision (prod vs. staging seed data is still open).
- **#3** subscription-cancellation blocker — investigated instead of fixed: confirmed no subscription product is currently sold through either app (matches the performance/security audit's deferred Critical #2 — the Stripe subscription webhook/routes are dead, unregistered `_route.ts` files). Nothing to disclose today. **Watch for:** if web subscriptions are ever re-enabled, Apple 3.1.2 would then require the mobile app to at least link out to manage/cancel it, via the same handoff pattern used for Elite payments.
- **#7** Financial-info/photo data categories — confirmed this is App Store Connect's Privacy Nutrition Label and Play Console's Data Safety form (dashboard questionnaires filled at submission time, not code). A ready-to-paste paragraph was written identifying which categories to declare (Financial Info: investment amount + payment-proof images; Photos/Videos: beyond chat, also trade-execution/close-request evidence images) and why.
- **#13** OAuth consent not separately revoked on account deletion — investigated before declining: neither `auth/google/route.ts` nor `auth/apple/route.ts` ever captures or stores a real OAuth access/refresh token (only a short-lived id/identity token, verified once and discarded) — so there is nothing to call a revoke API with today. A correct implementation would need mobile-side changes (capture `serverAuthCode`/`authorizationCode` at sign-in), new backend token storage, and (for Apple) client-secret-JWT signing infra — real new scope, not a safe quick fix, so left alone per the user's own "if it can't be done 100% reliably, don't" instruction. Confirmed not required by Apple 5.1.1(v) either way.
- **#15** `eas.json` placeholder Apple submit credentials — only affects the `eas submit` CLI auto-upload command, not App Review itself; needs the user's real Apple ID email + numeric App Store Connect App ID before it can be filled in.

**Deferred by explicit user decision:**
- **#12** misplaced Firebase Admin SDK key file inside `mobile/` (confirmed gitignored/untracked — no active leak, just needs relocating out of the mobile app's folder later) — "will be done later."

**New files added:** `pharma-stock/src/components/app/MobileTermsOfService.tsx`, `pharma-stock/src/app/en/terms-of-service/page.tsx`, `pharma-stock/src/app/ar/terms-of-service/page.tsx`.

**Files touched:** `mobile/locales/en.json`, `mobile/locales/ar.json`, `mobile/app.json`, `mobile/app/(tabs)/profile.tsx`, `mobile/app/(tabs)/elite/apply.tsx`, `mobile/app/(tabs)/elite/payments.tsx`, `mobile/app/settings/index.tsx`, `mobile/app/(tabs)/daily-updates/[id].tsx`, `mobile/app/(auth)/login.tsx`, `mobile/lib/notifications.ts`, `pharma-stock/src/app/api/mobile/v1/elite/payment-handoff/route.ts`, `pharma-stock/src/components/program/ElitePortfolioPage.tsx`.

---

## 1. Payment handoff risk (Elite firm-profit-sharing) — highest priority

**Flow traced:** `mobile/app/(tabs)/elite/payments.tsx` → `POST /api/mobile/v1/elite/payment-handoff` → in-app browser (`expo-web-browser`'s `openBrowserAsync`, `payments.tsx:91`) → `pharma-stock/src/app/handoff/page.tsx` (NextAuth `mobile-handoff` provider) → `/elite-group/portfolio` → `POST /api/elite/firm-profit-payment` → Stripe Checkout or bank transfer.

The amount charged (`pendingFirmProfit`) is the realized trading-profit share owed to the firm minus already-paid allocations (`pharma-stock/src/modules/program/program.service.ts:925-940, 1456-1459`) — a genuine real-world debt settlement on an investment product, not a digital-content unlock. The mobile app exposes **no other** payment/subscription/checkout flow, so this is the only money-movement path in the app.

### Blockers
None identified. The mechanism itself — the system in-app browser (SFSafariViewController-class), not an embedded WebView — is Apple's documented-safe pattern for this kind of handoff, and the underlying transaction is tied to a real-world investment settlement, which is the correct legal basis for the Guideline 3.1.1 external-services exemption (and Play's real-world/financial-services carve-out).

### Warnings
1. **Button copy reads like a digital purchase, not a real-world transfer.** The button is literally **"Pay Now"** / Arabic **"ادفع الآن"** (`mobile/locales/en.json:316`, `ar.json:316`), with a generic pre-browser hint: *"You'll be taken to a secure page in your browser to complete payment."* (`en.json:317`). Nothing frames this as an investment profit-sharing transfer rather than a plain purchase — exactly the pattern that triggers 3.1.1 scrutiny.
   **Next step:** reword to something like "Settle Profit-Share Payment" with a hint such as "This transfers your outstanding investment profit-share to our firm — not a digital purchase. You'll complete it securely on our website." Mirror the change in `ar.json`.
2. **No in-app disclosure before leaving the app.** `handlePayNow()` opens the browser immediately on tap (`payments.tsx:88-97`) with no confirmation screen explaining what the payment is for.
   **Next step:** add a one-time (or always-shown) confirmation sheet stating this is a real-world financial transfer tied to an investment product, before the browser opens.
3. **Google Play Payments policy** — the real-world/financial-services carve-out should apply for the same reason as above, but Play reviewers are strict about *any* button that exits the app to a payment page without visible context. The same copy fix in Warning 1 mitigates this for both stores.

### Suggestions
- Submit reviewer notes to both stores explicitly describing the flow and citing the profit-sharing/investment nature of the payment, plus provide a demo Elite account with a pending payment so reviewers can see the full context.
- `dismissBrowser()` has an iOS-only limitation noted in a comment (`payments.tsx:71-74`) that can leave stray browser sheets open on Android — cosmetic, not a rejection risk, but worth fixing.

---

## 2. Account deletion (Apple 5.1.1(v) / Play Data Safety)

### Blockers
None found.

### Warnings
1. **Dead subtitle text.** `delete_account_subtitle` exists in both locale files (`en.json:466`, `ar.json:466`: "Permanently delete your account and personal data") and is referenced at `mobile/app/settings/index.tsx:119-124`, but the `SettingsRow` component only renders `label`/`value` — never a subtitle — so this text never actually shows on the row. The consequence is still explained in the confirm dialog right before deletion, so risk is low.
   **Next step:** wire the subtitle into `SettingsRow`, or drop the unused key.
2. **OAuth consent isn't separately revoked.** Only the app's own `mobile_refresh_tokens`/`user_push_tokens`/session are revoked (`pharma-stock/src/app/api/mobile/v1/me/route.ts:215-227`) — the underlying Google/Apple OAuth grant itself isn't programmatically revoked. This is **not required** by Guideline 5.1.1(v) (which only requires the app account and its data be deleted), but worth having an answer ready if a reviewer asks.

### Suggestions (verified clean, no action needed)
- `DELETE /api/mobile/v1/me` (`route.ts:180-241`) authenticates via bearer JWT, runs in a transaction, archives to `deleted_accounts`, deletes `mobile_refresh_tokens`, `user_push_tokens`, `user_whatsapp`, then anonymizes `email/password/firstname/lastname/phonenumber/provider/provider_id/provider_email` — **identical code path for password and OAuth (Google/Apple) accounts**, no branching by `provider`. NULL-email edge case is handled correctly.
- Client flow (`settings/index.tsx:55-64`, `services/auth.service.ts:74-76`) is a single tap → native confirm Alert → `DELETE` call → on success clears SecureStore tokens (`stores/auth.store.ts:57-64`) → redirects to `/(auth)/login`. No support-contact step, no re-authentication requirement, no authenticated-but-deleted dead end.
- Locale copy is clean in both languages — no "signal" terminology, no emojis.

---

## 3. Financial-app / trading-terminology compliance

### Blockers
1. **Emoji regression — `mobile/app/(tabs)/profile.tsx:33` and `:64`.** The Elite section row renders a literal `⭐` emoji (`styles.eliteIcon`), in both the loading state and the active row. This is a live, current violation of the "zero emojis anywhere in mobile UI" rule, on a core, always-visible screen — not a historical leftover.
   **Next step:** remove the emoji glyph and render Elite's status via an icon component (the app already uses an icon library elsewhere) instead of `<Text>⭐</Text>`.
2. **No risk disclaimer anywhere in the Elite application/onboarding flow.** Searched `mobile/app/(tabs)/elite/apply.tsx` and both locale files for disclaimer-style language ("not investment advice", "risk of loss", "past performance", "capital at risk") — zero matches. The only loss-adjacent string is the form field label `"stop_loss": "Stop Loss"` / `"وقف الخسارة"`, which is not a disclaimer. Financial-app reviewers commonly look for this on both stores.
   **Next step:** add a risk disclaimer block to the Elite apply/onboarding screen, in both `en.json` and `ar.json`.

### Warnings
None beyond the two blockers above — no other emoji or "signal" leakage was found anywhere else checked.

### Verified clean (no regressions)
- `mobile/locales/en.json` / `ar.json` — every "signal" match is an internal i18n *key* (e.g. `signals.open_signals`); all rendered *values* correctly say "Ideas"/"الأفكار". No `"خطط التداول"` or bare `"إشارة"/"الإشارات"` values.
- `mobile/app/**`, `components/**`, `hooks/**` — all remaining "signal" occurrences are variable/type/route/file names (`Signal`, `useSignals`, `/signals/[id]`, `SignalCard`) or a non-rendered JSX comment (`home.tsx:79`). Every user-facing string goes through `t('signals.*')` keys, which are correctly rebranded.
- Daily-updates screens (`app/(tabs)/daily-updates/[id].tsx`, `_layout.tsx`, `components/dailyUpdates/DailyUpdateCard.tsx`, and the segment embedded in `app/(tabs)/news/index.tsx`) — no "signal" strings, no emojis. Built clean.
- `pharma-stock/src/lib/services/push.service.ts` — no "signal" wording; `daily_updates` has no push-notification trigger wired up at all currently, so there's no server push copy to check for that feature yet.

### Noted in passing (out of scope for this section, flagging for follow-up)
- `daily-updates/[id].tsx:36-40` has hardcoded English-only error strings ("Something went wrong", "Go back") not run through `t()` — an i18n/RTL completeness gap, not a terminology violation.
- `en.json:285` shows Elite minimum-investment copy as **"$100,000"** while the DB schema (`elite_applications_investment_amount_check`) enforces `>= $50,000` — a content/schema mismatch worth fixing for accuracy, unrelated to terminology.

---

## 4. Data collection & privacy disclosures

### Data categories the mobile app collects/sends (code evidence)
| Category | Evidence | Notes |
|---|---|---|
| Auth/identity (email, password, name, phone) | `services/auth.service.ts:16-43` | Expected |
| OAuth identifiers (Google `idToken`; Apple `identityToken` + optional `fullName`) | `auth.service.ts:45-62` | Expected — should map to "Contact Info"/identity in nutrition labels |
| Elite application data (phone, investment amount, free-text description) | `services/elite.service.ts:21-29` | No investor IBAN/bank data collected — the firm's own bank details are only *displayed* to the investor |
| Firm-profit-payment proof uploads (image/file + free-text reference/note) | `elite.service.ts:199-220` | Plausibly contains bank transfer receipts with account numbers — sensitive financial data |
| Trade execution / close-request screenshots | `elite.service.ts:82-109, 133-163` | Financial data, moderate sensitivity |
| Push tokens (Expo token + device metadata) | `lib/notifications.ts:16-59` | Sent only after explicit OS permission prompt |
| Chat content & attachments (text/image/voice/video, uploaded to Cloudinary) | `services/chat.service.ts` | Sensitive — may include images/voice |
| WhatsApp number/PIN (`user_whatsapp` table) | — | **Not reachable from mobile at all** — web-only, out of scope |
| Analytics/crash reporting | `package.json` scan | None found — no Sentry/Firebase Analytics/Amplitude/Crashlytics. `google-services.json` is Expo/FCM push infra only |

### Blockers
None — no evidence of an entirely undisclosed data *category*. See Warnings for documentation gaps.

### Warnings
1. **No in-app Terms of Service link.** Privacy Policy is correctly linked and working — `settings/index.tsx:13-15, 80-82, 110-111` opens `https://biopharmastock.com/{en|ar}/privacy-policy` via `Linking.openURL` — but no Terms of Service link exists anywhere in `mobile/app/**`. Apple requires a EULA/Terms link for apps with any paid functionality.
   **Next step:** add a "Terms of Service" row next to Privacy Policy in `settings/index.tsx`, in both languages.
2. **Financial-data categories likely need explicit line items** in the App Store Privacy Nutrition Label ("Financial Info") and Play Data Safety form ("Financial info", "Photos/Videos"), given the bank-transfer proof images and Elite application data.
   **Next step:** cross-check the live store listings include these categories (you noted you'll confirm the listing content separately).
3. **Misplaced Firebase Admin SDK credential file.** `mobile/pharmastock-d0cb4-firebase-adminsdk-fbsvc-b875dfb8a1.json` is a server-side secret sitting inside the mobile app's folder. Confirmed via `git check-ignore` that it's covered by `.gitignore` and **not tracked in git or git history** — no active leak — but it doesn't belong near a client app's directory tree.
   **Next step:** move it out of `mobile/` entirely into a secrets manager or the web app's server-only config.

### Suggestions
- Confirm Cloudinary-hosted chat/upload media isn't publicly listable via guessable URLs — adjacent to a privacy question, flag for backend review.

---

## 5. Permissions & platform requirements

### Blockers
None found.

### Warnings
1. **Conflicting camera/photo-library usage strings.** `mobile/app.json:15-16` sets accurate, specific `NSCameraUsageDescription`/`NSPhotoLibraryUsageDescription` text ("trade evidence photos"/"share images in chat"), but the `expo-image-picker` plugin block at `app.json:88-94` sets its own generic `cameraPermission`/`photosPermission` strings ("Used to take photos."/"Used to upload profile photos." — a "profile photos" feature that doesn't appear to exist in this app). Expo's config-plugin mod ordering means the plugin-supplied strings can silently overwrite the top-level ones at prebuild time, so reviewers may see the vague/inaccurate string.
   **Next step:** delete the `photosPermission`/`cameraPermission` keys from the `expo-image-picker` plugin config, or make them exactly match the top-level `infoPlist` strings.
2. **Push permission requested with no context.** `app/_layout.tsx:36-39` calls `registerForPushNotifications()` (which triggers `Notifications.requestPermissionsAsync()`, `lib/notifications.ts:27`) immediately after login succeeds, with no explanatory UI first.
   **Next step:** add a one-time in-app explainer ("Get notified about ideas and account updates") before requesting the native permission.
3. **Likely-unused `RECEIVE_BOOT_COMPLETED` Android permission** (`app.json:59`) — no scheduled/local-notification-after-reboot logic was found anywhere in the notification code.
   **Next step:** remove it unless a specific boot-triggered feature exists, or add a one-line Play Console justification.

### Suggestions (verified clean, no action needed)
- `expo-apple-authentication` (`package.json:21`) + `com.apple.developer.applesignin` entitlement (`app.json:32-34`) are present, and Sign in with Apple is conditionally rendered alongside Google Sign-In (`app/(auth)/login.tsx:194`) — correctly satisfies Apple's "must offer Apple Sign-In if any other social login is offered" rule.
- Camera/photo/microphone permissions are all genuinely used where declared (trade-plan evidence uploads in `elite/trade-plans/[id].tsx`, `portfolio.tsx`; chat voice/video/image in `components/chat/VoiceMessage.tsx`, `ChatInput.tsx`, `VideoMessage.tsx`) — no unused-permission issue.
- No `ios.deploymentTarget`/Android `minSdkVersion` override in `app.json`; Expo SDK 54 defaults apply uniformly (iOS 15.1+, Android minSdk 24) and all installed native packages are within SDK 54's supported range — no min-OS/API mismatch found.
- Noticed in passing: `mobile/eas.json` still has placeholder `submit.production.ios.appleId`/`ascAppId` values — this will block `eas submit` regardless of App Review outcome (see Housekeeping checklist below).

---

## 6. General store-readiness housekeeping

### Blockers
1. **No subscription-cancellation information anywhere in the app.** Grepped `mobile/app/**` and both locale files — the only "cancel" strings are generic dialog/voice-message cancel buttons. There is no Settings/Profile copy or screen telling a subscriber how to manage or cancel their Stripe-billed subscription. Apple Guideline 3.1.2 requires this to be clear even when billing happens outside IAP.
   **Next step:** add a "Manage/Cancel Subscription" row in `settings/index.tsx` (or Profile) with instructions or a link, in both locale files.

### Warnings
1. **No reviewer path into Elite gated content.** `app/(tabs)/elite/status.tsx:42-103` only unlocks "Go to Dashboard" once the server returns `application_status === 'APPROVED'` or `is_elite_member` — there's no demo account, client-side override, or seed-without-payment path in the mobile code. A fresh reviewer account cannot reach the Elite dashboard/portfolio/trade-plans screens at all, a common rejection reason for gated content.
   **Next step:** seed a pre-approved demo `elite_members` row server-side and hand reviewers that credential, plus include reviewer notes/screenshots walking through the gated screens.
2. **`console.log` calls that could leak sensitive data in production.** `lib/notifications.ts:50` logs the full Expo push token; `app/(auth)/login.tsx:107` logs `JSON.stringify(err)` on Google sign-in failure, which can include OAuth error payloads.
   **Next step:** wrap both in `if (__DEV__)` or remove before release builds.
3. **Firebase Admin SDK service-account key inside `mobile/`** — same file flagged in §4; confirmed it contains a `private_key` field and is gitignored/untracked (no active leak), but its location is risky housekeeping regardless.
   **Next step:** relocate outside the mobile repo entirely.

### Suggestions
- `mobile/google-services.json` being tracked in git is expected/normal (Firebase Android client config — public API key + OAuth client ID only, no secret).
- No placeholder/test content ("Lorem ipsum", `TODO`, `test@test.com`, hardcoded credentials) found anywhere under `mobile/app/**`.
- Expo SDK 54 / RN 0.81.5 with no `deploymentTarget`/`minSdkVersion` overrides — inherits SDK 54's own supported minimums, no declared-vs-actual mismatch.
- `mobile/eas.json` has placeholder `submit.production.ios.appleId`/`ascAppId` — fill these in before running `eas submit`, independent of App Review.

---

## Prioritized Checklist (ordered by rejection risk)

| # | Item | Type | Section | Next step |
|---|---|---|---|---|
| 1 | Payment handoff button/copy reads as a plain purchase ("Pay Now") with no pre-browser disclosure | Warning | §1 | Reword to "Settle Profit-Share Payment" + add a confirmation sheet explaining the real-world transfer, before opening the browser. Mirror in `ar.json`. |
| 2 | No demo/reviewer path into Elite gated content | Warning | §6 | Seed a pre-approved demo `elite_members` account server-side; include reviewer notes + screenshots. |
| 3 | No subscription-cancellation info in-app | Blocker | §6 | Add a "Manage/Cancel Subscription" row + copy in Settings/Profile, both languages. |
| 4 | Emoji (`⭐`) in `profile.tsx` Elite row | Blocker | §3 | Remove the emoji glyph; use an icon component instead. |
| 5 | No risk disclaimer in Elite apply/onboarding flow | Blocker | §3 | Add "not investment advice / risk of loss" disclaimer copy to apply screen, both languages. |
| 6 | No in-app Terms of Service link | Warning | §4 | Add a ToS row next to Privacy Policy in Settings, both languages. |
| 7 | Financial-info/photo data categories possibly missing from store privacy forms | Warning | §4 | Cross-check App Store Nutrition Label + Play Data Safety form include Financial Info / Photos. |
| 8 | Conflicting camera/photo-library usage strings (`app.json` top-level vs. `expo-image-picker` plugin) | Warning | §5 | Remove/align the plugin's `cameraPermission`/`photosPermission` overrides. |
| 9 | Push permission requested with no context | Warning | §5 | Add a one-time explainer screen before requesting notification permission. |
| 10 | Unused `RECEIVE_BOOT_COMPLETED` Android permission | Warning | §5 | Remove, or justify in Play Console. |
| 11 | `console.log` of push token / OAuth error payload | Warning | §6 | Gate behind `__DEV__` or remove. |
| 12 | Firebase Admin SDK key file inside `mobile/` (untracked, but misplaced) | Warning | §4 / §6 | Move out of the mobile repo into a secrets manager. |
| 13 | OAuth consent not separately revoked on account deletion | Warning | §2 | Not required by Guideline 5.1.1(v); have an explanation ready if asked. |
| 14 | Dead `delete_account_subtitle` translation key never rendered | Warning | §2 | Wire into `SettingsRow` or drop the key. |
| 15 | `eas.json` placeholder Apple submit credentials | Suggestion | §5/§6 | Fill in before running `eas submit` (independent of App Review). |
| 16 | `daily-updates/[id].tsx` hardcoded English-only error strings | Suggestion | §3 | Route through `t()` for full i18n/RTL coverage. |
| 17 | Elite minimum-investment copy says "$100,000" vs. DB-enforced "$50,000" | Suggestion | §3 | Reconcile copy with actual minimum. |
| 18 | `dismissBrowser()` Android limitation may leave stray browser sheets | Suggestion | §1 | Cosmetic fix, not a rejection risk. |

**No items in this report require code changes I've already made — this file is read-only reporting per your instructions.** Let me know which items you'd like me to fix first; items 1–5 are the ones most likely to affect review outcomes.
