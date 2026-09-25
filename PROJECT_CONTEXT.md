# PHARMAsTOCK — Project Context

> Last verified against the code on **2026-09-25** (branch `seo/phase-0`, HEAD `d316efc`).
> Schema export in `Desktop/Father/pharmastock-files/final-final-final-schema.sql` is from **2026-07-25** and
> now predates five migrations — see §5 "Migrations".

---

## 1. What this product is

A bilingual (English/Arabic, RTL-aware) **stock research & managed-portfolio ("Elite") platform** for the US
biopharma sector, with a **partner/affiliate referral program**. It has three faces:

1. **Public marketing site** — landing pages, Elite/partner program info, news, FDA designations, daily video,
   community, legal pages (in `en`/`ar`).
2. **Web app** (Next.js, subscriber + admin facing) — signals, stock research, Elite investor dashboards,
   partner dashboards, admin back-office.
3. **Mobile app** (Expo/React Native, iOS & Android) — a **content-and-chat-only** subscriber client consuming
   `/api/mobile/v1/*`: news, breakthroughs, daily updates, chat/support, notifications, profile.

Both clients share **one PostgreSQL database** and are **served from the same Next.js codebase** — the mobile app
is a separate repo/app that only calls the web app's mobile API namespace.

> **Stripe subscriptions are currently switched off.** The pricing/checkout pages are `_`-prefixed private
> folders (`src/app/en/_subscription`, `_success`), `/api/subscriptions`, `/api/payments` and
> `/api/payments/webhook` no longer exist, and the `SUBSCRIBED_ROUTES` gate in `middleware.ts` is commented out.
> `PricingSection.tsx`, `SeccessComp.tsx` and `CheckoutForm.tsx` remain in the tree but call dead endpoints.
> The only live Stripe path is Elite firm-profit payments (`/api/stripe/program-webhook`).
> Don't "fix" these components or re-enable the gate without being asked.

### Core business domains
- **Signals** — buy/sell stock signals (entry price, targets, reasoning in EN/AR) for **web** subscribers, plus
  historical performance (`signals`, `signal_history`). **Not present in the mobile app** (see §4).
- **Elite Program** — managed-portfolio program for larger investors (min. $50,000, enforced by CHECK on
  `elite_applications`). Apply → approve → portfolio → admin "trade plan" → investor accepts/rejects →
  execution logged → position tracked → close request → closure. Plus firm profit-sharing payments (Stripe **or**
  bank transfer), loss carry-forward, investor-requested capital changes, and bank account management.
  **Web-only** since the mobile Elite feature was deleted.
- **Partners / Affiliates** — approved partners get a referral code/link, refer investors into Elite, track
  linked clients, request payouts, earn commissions.
- **Content** — news articles, "breakthroughs" (FDA designations/announcements), **daily updates** (short
  admin-authored per-symbol bilingual notes, no price field, scoped to a rolling day — a separate content type
  from breakthroughs, don't conflate them), daily video + Q&A, market price caching.
- **Messaging/Support** — real-time chat between users and admins (Socket.IO), plus admin broadcast campaigns to
  user segments.
- **Notifications** — in-app notifications + Expo push to mobile devices.
- **Admin back-office** — approves Elite applications/partners, manages users, creates trade plans and signals,
  reviews payout/close/capital requests and payment proofs, manages broadcasts, news, daily updates, bank
  accounts and stock research.
- **Page analytics** — every client-side route change POSTs to `/api/log`, which writes a `path_log` row
  (path, user_id, country, region, ip, user_agent). See §5.
- **Account deletion (mobile)** — self-service "Delete Account" in mobile Settings. **Anonymizes** the `users`
  row (email/name/phone/provider scrubbed, password replaced with an unusable hash) rather than hard-deleting,
  so FK'd history stays intact for accounting/legal retention; archives to `deleted_accounts`, revokes mobile
  sessions/push tokens, and revokes the Apple Sign-In association via Apple's `/auth/revoke`
  (`users.apple_refresh_token_enc`). There is also a public web page at `/en|ar/delete-account`.

---

## 2. Repositories & how they relate

| Piece | Folder | Tech | Talks to |
|---|---|---|---|
| **Web app** (app + backend) | `./pharma-stock` | Next.js 15 (App Router) + React 19, TS | Postgres directly (`pg`), Stripe, Socket.IO server, Nodemailer, Expo Server SDK |
| **Mobile app** | `./mobile` | Expo SDK 54 + React Native 0.81 + expo-router, TS | **Only** `/api/mobile/v1/*` (never touches the DB) |
| **Database** | — | PostgreSQL | Owned/accessed only by the web app codebase |

The **web app is the backend for everything**, including mobile. There is no separate backend service — Next.js
API routes (`src/app/api/**`) are the entire server-side. Started with a **custom server** (`server.ts`, via
`npm run dev` / `npm start` — *not* plain `next dev`) because it also boots Socket.IO
(`src/lib/socket/socket-server.ts`). `npm run dev:next` exists but gives you no sockets.

---

## 3. Web app architecture (`./pharma-stock`)

### 3.1 Stack
Next.js 15 App Router, React 19, TypeScript, Tailwind + shadcn/radix, NextAuth (web sessions), `pg` for raw SQL
(no ORM), Stripe SDK, Socket.IO, Nodemailer, Expo Server SDK, Zod, SWR, Recharts, framer-motion, js-cookie.

### 3.2 Key folders
```
pharma-stock/
├── server.ts                 # Custom Node server entry (Next.js + Socket.IO)
├── middleware.ts             # NextAuth route protection, i18n redirect, admin gate
├── migrations/               # SQL applied on top of the base schema (see §5)
├── pages/api/auth/[...nextauth].ts   # The ONLY Pages-Router file left
├── src/
│   ├── app/
│   │   ├── en/ , ar/         # Public + subscriber pages, localized per language
│   │   │   (auth, signals, ask-about-stock, elite-group{,/dashboard,/portfolio,
│   │   │    /executions,/plan,/closures}, partners, news, daily-video, community,
│   │   │    history, fda-designation, profile, policy, privacy-policy,
│   │   │    terms-of-service, delete-account, _subscription*, _success*)
│   │   │   (* `_`-prefixed = private folder, NOT routed — subscriptions are off)
│   │   ├── admin/            # Admin back-office (mirrors src/app/api/admin)
│   │   ├── handoff/          # Public mobile→web session handoff landing page
│   │   ├── robots.ts, sitemap.ts   # SEO (sitemap derives lastmod from the DB)
│   │   └── api/              # ALL server endpoints (route.ts handlers)
│   ├── modules/
│   │   ├── program/program.service.ts   # LARGE — core Elite business logic
│   │   ├── program/route-helpers.ts     # getAuthUser() / requireAdmin()
│   │   └── market-data/                 # Provider abstraction + price caching
│   ├── lib/
│   │   ├── db.ts, nextAuth.ts, stripe.ts, emailService.ts
│   │   ├── seo.ts            # buildAlternates() — canonical + hreflang
│   │   ├── rate-limit.ts     # Web login limiter (10 / 15 min), used by NextAuth
│   │   ├── queries/news.ts   # Server-side news fetch for SSR'd news pages
│   │   ├── evidence-upload.ts, evidence-security.ts  # Proof/screenshot uploads
│   │   ├── mobile/           # Mobile JWT, auth middleware, rate-limit, paginate,
│   │   │                     #   api-handler, day-window, Apple token crypto
│   │   ├── services/         # chat, notification, push (Expo), user, audience
│   │   └── socket/           # Socket.IO server
│   └── components/           # Shared React UI (web only)
│       └── program/shared.tsx  # StatCard, SectionCard, HeroPanel, EmptyState, …
└── src/config/app-store.ts   # App Store / Google Play links (single source)
```

### 3.3 Admin surface (`src/app/api/admin/**`, pages under `src/app/admin/**`)
agents/partners approval · bank-settings & firm-bank-accounts · breakthroughs (+bulk) · broadcasts ·
capital-requests · close-requests · commissions · community · daily-updates (+bulk) · daily-video ·
elite-applications · elite-portfolios (assign-execution, force-open, payout-request, plans, pending-profit) ·
firm-profit-payments (+review) · history · management (stock research) · manual-elite-members · messages ·
mobile (broadcasts, conversations, groups, uploads, users) · **monitor** · news (+bulk) · partners · payouts ·
positions (force-close, close-request) · referrals · signals · subscriptions · trade-plans/messages · users.

### 3.4 Auth (web)
- **Web sessions**: NextAuth (`src/lib/nextAuth.ts`), JWT-cookie based, roles `user` / `admin` on `users.role`.
  Providers: `Credentials` (rate-limited 10/15min), `Google`, `Apple` (web, enabled only when all four
  `APPLE_*` env vars are set), and `mobile-handoff`.
- **`callbacks.signIn` is the single choke point every web login passes through** — provider account
  linking/creation lives there, and so does auth logging (§5, `auth_log`).
- Route protection is centralized in `middleware.ts` via `PROTECTED_ROUTES`; `/api/admin/*` is separately gated
  for admin role. Public marketing pages (landing, `/elite-group`, `/partners`) stay public. `/handoff` is
  explicitly public — it exchanges its token for the session itself; don't add it to `PROTECTED_ROUTES`.
- Locale via a `preferred_language` cookie + `en`/`ar` route segments. **A path with no language prefix falls
  back to `ar`**, not `en`.

---

## 4. Mobile app architecture (`./mobile`)

> **Scope shrank sharply for App Store review.** The Signals ("Ideas") and Elite features were **deleted**
> (`8000c4b`, `bef9a41`). The mobile app is now content + chat + notifications only. The backend's
> `/api/mobile/v1/signals*` and `/api/mobile/v1/elite/*` routes still exist but **have no mobile caller** —
> likewise `/api/mobile/v1/elite/payment-handoff`, the `mobile-handoff` provider, `/handoff` and
> `mobile_web_handoff_tokens`. Treat the handoff machinery as dormant-but-intact; it's the established pattern
> if a future feature needs a web escape hatch (§7).

### 4.1 Stack
Expo SDK 54, React Native 0.81, expo-router, TypeScript, `axios`, `@tanstack/react-query`, `expo-secure-store`,
`react-hook-form` + zod resolvers, `i18next`/`react-i18next` (EN/AR + RTL), `expo-notifications`,
`expo-web-browser`, native Google/Apple sign-in. App `1.0.1`, iOS build `1`, Android `versionCode 4`,
bundle id `com.biopharmastock.app`.

### 4.2 How the mobile app talks to the backend
- Base URL: `EXPO_PUBLIC_API_URL` (defaults `http://localhost:3000`). `constants/api.ts` centralizes every path.
- **Auth is separate from NextAuth.** Mobile uses its own **JWT access token + opaque refresh token**
  (`src/lib/mobile/jwt.ts`, HMAC-SHA256, `MOBILE_JWT_SECRET`, short access TTL; `mobile_refresh_tokens` holds
  SHA-256-hashed long-lived refresh tokens). `services/api.ts` attaches `Authorization: Bearer <access>` and
  transparently refreshes on 401 via `/auth/refresh`, queuing concurrent requests during a refresh.
- Server-side helpers in `src/lib/mobile/`: `jwt.ts`, `auth-middleware.ts`, `rate-limit.ts`, `paginate.ts`,
  `api-handler.ts`, `day-window.ts` (calendar-day scoping for daily updates), `appleClientSecret.ts` /
  `appleTokens.ts` / `appleTokenCrypto.ts` (Apple revocation on account deletion).
- Social login: native sign-in (`lib/googleSignIn.ts`, `lib/appleSignIn.ts`) → token exchanged at
  `/api/mobile/v1/auth/google` / `/auth/apple`.
- Realtime: `lib/socket.ts` connects to the same Socket.IO server. Push goes out server-side only via
  `src/lib/services/push.service.ts` using `user_push_tokens`.

### 4.3 App structure (expo-router — folders = routes)
```
mobile/
├── app/
│   ├── (auth)/          # login, register, verify, forgot/reset password
│   ├── (tabs)/          # Home · News · Breakthroughs · Chat · Notifications · Profile
│   │   ├── home.tsx
│   │   ├── news/           # list + [id]
│   │   ├── breakthroughs/  # list + [id]   (promoted to a tab)
│   │   ├── chat/           # conversations list + [conversationId]
│   │   ├── daily-updates/  # [id] only — hidden tab (href: null), reached from News
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── settings/        # index (incl. delete-account flow), language, about
│   ├── edit-profile.tsx, notifications.tsx
│   └── _layout.tsx / index.tsx
├── services/            # api, auth, news, breakthroughs, dailyUpdates, chat, notifications
├── hooks/               # useChat, useContent, useNotifications
├── stores/              # auth.store.ts, ui.store.ts
├── lib/                 # socket, notifications, rtl, bidi, day, format, navigation,
│                        #   i18n-content, googleSignIn, appleSignIn
├── i18n/, locales/      # en.json / ar.json
├── constants/           # api.ts (ALL endpoint paths), colors.ts, storage-keys.ts
└── types/               # api.ts, content.ts, navigation.ts, user.ts
```

### 4.4 Mobile API surface actually used by the app
`auth` (login/register/verify/refresh/logout/forgot/reset/google/apple) · `me` (+ `me/language`;
`DELETE me` = account deletion) · `news` (+ `[id]`) · `breakthroughs` (+ `[id]`) ·
`daily-updates` (+ `[id]`, `available-dates`) · `market/[symbol]` · `push-token` ·
`notifications` (+ `[id]/read`, `unread-count`, `read-all`) · `chat` (conversations, messages, `messages/[id]/read`) ·
`uploads/chat`.

**Still served but unused by the app:** `signals` (+ `[id]`, `history`), `elite/*` (apply, status, dashboard,
portfolio, trade-plans, executions, close-requests, firm-profit-payments, bank-accounts, payment-handoff).

**Rule of thumb:** every mobile-visible feature has a matching admin surface under
`src/app/api/admin/mobile/**` (broadcasts, conversations, groups, uploads, users).

---

## 5. Database

Single PostgreSQL schema (`public`), no ORM — raw SQL via `pg` (`src/lib/db.ts`), with Elite business logic
centralized in `src/modules/program/program.service.ts`.

### Users & auth
- `users` — core record (email, hashed password, name, phone, `role`, `preferred_language`, OAuth provider
  fields, `apple_refresh_token_enc`, `last_login_at`).
- `auth_log` — every login attempt: `user_id`, `client` (`web`/`mobile`), `method`
  (`credentials`/`google`/`apple`/`handoff`/`refresh`), `success`, `email_attempted`, `ip`, `user_agent`,
  `created_at`. Written fire-and-forget from `callbacks.signIn` (web) and the mobile `/auth/*` routes; a
  logging failure must never fail a login.
- `path_log` — page-view analytics written by `POST /api/log` from `PageTracker` (mounted in the root layout):
  `path`, `user_id` (null for guests), `visited_at`, `country`, `region`, `ip`, `user_agent`. **Grows fast**
  (~63k rows by Aug 2026) — the admin monitor page can prune it.
- `pendingusers` (unverified signups) · `resettokens` · `mobile_refresh_tokens` (hashed) ·
  `mobile_web_handoff_tokens` (hashed, single-use, short TTL — dormant, see §4) · `deleted_accounts`
  (anonymization archive) · `user_push_tokens` (Expo) · `user_whatsapp` · `pageaccess` · `waitinglist`.

### Billing / subscriptions *(dormant — see §1)*
`packages` · `subscriptions` · `subscription_discounts` · `transactions`.

### Signals & content
- `signals` — **only currently-open** signals; closing one deletes the row and inserts into `signal_history`.
  `ux_signals_symbol_upper` enforces at most one open signal per symbol (the app also checks in
  `src/app/api/admin/signals/route.ts`).
- `signal_history` · `news` · `breakthroughs` · `daily_updates` (rolling feed, day-scoped reads) ·
  `videos` + `questions` · `price_cache`, `price_cache_simple` · `system_settings`.

### Elite managed-portfolio program
`elite_applications` (min $50k CHECK; `agreement_accepted_at`, `agreement_version`) · `elite_members` ·
`elite_portfolios_simple` (`unrecovered_loss_balance` — loss carry-forward) · `trade_plans` ·
`trade_plan_messages` · `trade_executions` · `portfolio_positions_simple` · `position_close_requests` ·
`position_closures_simple` (`loss_offset_applied`, `portfolio_loss_balance_after`) ·
`capital_change_requests` (investor requests a free-capital change; **only an admin approval calls
`setFreeCapital()`** — investors can no longer overwrite capital directly) · `elite_fee_settings` ·
`elite_activity_logs` · `firm_bank_accounts` · `firm_profit_payments` (Stripe **and** bank-transfer/manual
flow: `payment_method`, `proof_url`, `submitted_at`, `reviewed_by`, …) · `firm_profit_payment_allocations`.

### Partners / affiliates
`partner_accounts` · `partner_investor_links` · `partner_payout_requests`.

### Messaging / notifications
`chat_conversations` · `chat_messages` · `in_app_notifications` (bilingual `title_en/ar`, `body_en/ar`) ·
`broadcast_campaigns` · `broadcast_groups` · `broadcast_recipients`.

### Migrations (`pharma-stock/migrations/*.sql`)
Applied on top of the base schema, roughly in order:
`mobile_v1.sql` → `mobile_v1_patch.sql` → `mobile_v2.sql` → `mobile_v2_bilingual_notifications.sql` →
`daily_updates.sql` → `signals_unique_symbol.sql` → `account_deletion.sql` → `mobile_web_handoff_tokens.sql` →
**`capital_change_requests.sql`** → **`elite_loss_carry_forward.sql`** → **`elite_agreement_acceptance.sql`** →
`bank_transfer_payments.sql` → **`apple_refresh_token.sql`** → **`path_log.sql`** → **`auth_log.sql`**.

> The `final-final-final-schema.sql` export is dated **2026-07-25** and therefore does **not** contain:
> `capital_change_requests`, `path_log`, `auth_log`, `users.apple_refresh_token_enc`,
> `users.last_login_at`, `elite_applications.agreement_*`,
> `elite_portfolios_simple.unrecovered_loss_balance`, or
> `position_closures_simple.loss_offset_applied` / `.portfolio_loss_balance_after`.
> **Re-generate the export before handing it to Claude Code.**

---

## 6. Mobile App Store compliance conventions

To stay within Apple App Store review guidelines around financial trading/advice apps, the **mobile app
intentionally avoids trading/signals terminology and emojis** — even though the web app and database keep the
original terms internally:

- **No emojis anywhere in the mobile app UI.**
- **English:** never surface "signal(s)" in mobile copy — use **"idea(s)"**.
- **Arabic:** use **"الأفكار" / "فكرة"** instead of "الإشارات" / "إشارة", and **"خطط الاستثمار"** instead of
  "خطط التداول".
- Display-layer only: DB tables/columns (`signals`, `trade_plans`, …), API paths
  (`/api/mobile/v1/signals`), identifiers and the web app's own UI are **not** renamed.
- Now that the mobile Signals feature is deleted, this survives in exactly one place:
  `locales/{en,ar}.json → notifications.types.signal_open / signal_close`. **This is intentional and must
  stay:** the backend still pushes "New Idea" / "Idea Closed" notifications to mobile, they land in the
  Notifications tab, and they are how subscribers learn an idea opened or closed even though the app itself
  has no signals screen. Don't "clean up" these keys or stop sending these pushes.
  The mechanism: `handleNotificationTap` in `mobile/lib/notifications.ts` routes only `screen === 'chat'`
  explicitly and sends **everything else to `/notifications`** — so a signal push has a valid destination
  (the Notifications tab, where its bilingual title/body from `in_app_notifications` is readable) rather
  than dead-ending on a deleted route. Keep that `default` branch.
- Keep applying the terminology + no-emoji rule to any new mobile copy without being asked again.

Two other App Store-driven decisions:
- **Self-service account deletion** exists because Apple requires it for apps with account creation. It
  anonymizes rather than hard-deletes to preserve financial/legal history — don't "fix" it into a hard delete.
  It also revokes the Apple Sign-In association via Apple's `/auth/revoke` (guideline 5.1.1(v)).
- **Elite payments went through a web handoff, not native IAP** (Apple's IAP rules vs. an external financial
  service). The mobile Elite feature is gone, but the handoff pattern remains the template — don't invent a new
  one and don't move a payment flow in-app without re-checking current guidelines.

---

## 7. Cross-cutting conventions

- **No ORM.** Raw parameterized SQL through `pg`. Don't invent Prisma/TypeORM calls.
- **Bilingual by default.** Any `_en`/`_ar` field pair must be updated for both. Web pages live under both
  `src/app/en/**` and `src/app/ar/**`; mobile uses `locales/en.json` + `locales/ar.json` with `lib/rtl.ts`.
- **Two separate auth systems by design**: web = NextAuth session cookies; mobile = JWT access + refresh.
  A fix to "login" needs to know which client is affected.
- **Mobile never talks to Postgres.** A new mobile feature = route under `src/app/api/mobile/v1/**` +
  service/hook in `mobile/services/` & `mobile/hooks/` + entries in `mobile/constants/api.ts` and
  `mobile/types/api.ts`.
- **Admin API routes** start with `const auth = await requireAdmin(request); if ("error" in auth) return auth.error;`
  (`src/modules/program/route-helpers.ts`). `middleware.ts` gates `/api/admin/*` as a second layer.
- **Admin UI** reuses `src/components/program/shared.tsx` (`HeroPanel`, `SectionCard`, `StatCard`,
  `EmptyState`, `LoadingBlock`, `StatusBadge`) and `src/components/admin/adminPagination.tsx` with
  `PaginationMeta` from `src/lib/mobile/paginate.ts`.
- **Elite business logic is centralized** in `src/modules/program/program.service.ts`. Look there first before
  adding Elite DB logic elsewhere (the $50k minimum, status transitions, loss carry-forward, fee math).
- **Realtime chat** goes through `src/lib/socket/socket-server.ts`; `server.ts` (not `next dev`) must run.
- **Push notifications** are server-side only, via `src/lib/services/push.service.ts`.
- **Logging must never break the request it logs.** `path_log` and `auth_log` writes are fire-and-forget
  (`.catch()` / try-swallow) and must not hold a pooled connection across the response.
- **Mobile-to-web handoff pattern** (§4.2) is the template for any future flow that can't run natively: mint a
  single-use hashed token server-side, open it in `expo-web-browser`, consume it via a public NextAuth
  credentials provider + a dedicated public landing page.
- **Store links** for "Get the app" buttons live in **one** place: `src/config/app-store.ts`, overridable by
  `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL`. Both stores are live (Apple ID `6797457921`,
  Android package `com.biopharmastock.app`). The iOS link is intentionally storefront-less so Apple
  redirects each visitor to their own country's store.
