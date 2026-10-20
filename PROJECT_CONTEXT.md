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
- **Stocks, watchlists & alerts** — a curated universe of covered US biopharma symbols (`stocks`), per-user
  watchlists with an on/off alert flag, and **company announcements** (bilingual Markdown). Publishing
  content notifies the users watching that symbol; daily updates notify everyone. Present on **both** web
  and mobile.
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
(no ORM), Stripe SDK, Socket.IO, Nodemailer, Expo Server SDK, Zod, SWR, Recharts, framer-motion, js-cookie,
`next-themes` (dark mode), `react-markdown` + `remark-gfm` + `@tailwindcss/typography` (announcement Markdown).

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
│   │   │    terms-of-service, delete-account, stocks{,/[symbol]}, watchlist,
│   │   │    announcements{,/[id]}, _subscription*, _success*)
│   │   │   (* `_`-prefixed = private folder, NOT routed — subscriptions are off)
│   │   ├── admin/            # Admin back-office (mirrors src/app/api/admin)
│   │   ├── handoff/          # Public mobile→web session handoff landing page
│   │   ├── robots.ts, sitemap.ts   # SEO (sitemap derives lastmod from the DB)
│   │   └── api/              # ALL server endpoints (route.ts handlers)
│   ├── modules/
│   │   ├── program/program.service.ts   # LARGE — core Elite business logic
│   │   ├── program/route-helpers.ts     # getAuthUser() / getOptionalAuthUser() / requireAdmin()
│   │   ├── stocks/stocks.service.ts     # Universe, search, watchlist (web + mobile)
│   │   ├── stocks/announcement.schema.ts  # Zod schema shared by the admin route + page
│   │   └── market-data/                 # Provider abstraction + price caching
│   ├── lib/
│   │   ├── db.ts, nextAuth.ts, stripe.ts, emailService.ts
│   │   ├── seo.ts            # buildAlternates() — canonical + hreflang
│   │   ├── rate-limit.ts     # Web login limiter (10 / 15 min), used by NextAuth
│   │   ├── queries/news.ts   # Server-side news fetch for SSR'd news pages
│   │   ├── evidence-upload.ts, evidence-security.ts  # Proof/screenshot uploads
│   │   ├── mobile/           # Mobile JWT, auth middleware, rate-limit, paginate,
│   │   │                     #   api-handler, day-window, Apple token crypto
│   │   ├── services/         # chat, notification, push (Expo), user, audience,
│   │                     #   content-alert (watchlist / daily-update fan-out)
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
**announcements** (company announcements, bilingual Markdown) · **stocks** (covered universe) ·
**notifications** (send a notification to every user, EN+AR — the general-purpose announcement tool) ·
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

### 3.5 Web theming (light + dark)

- **Scope: public + subscriber pages only. `/admin` stays light.** `AppThemeProvider`
  (`src/components/app/AppThemeProvider.tsx`) wraps the app with `next-themes`
  (`attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`) and passes
  `forcedTheme="light"` whenever `usePathname()` starts with `/admin`. `<html>` carries
  `suppressHydrationWarning` because next-themes sets the class in a pre-paint script.
- **Light is frozen.** Dark styling is expressed as `dark:` siblings **added next to** the light classes — a
  light class is never replaced or removed. Two traps broke this during the migration and were fixed: an
  opacity suffix (`bg-white/10` must not become `bg-white dark:bg-slate-900/10`) and text on a brand fill
  (`bg-brightTeal text-royalBlue` keeps `text-royalBlue` in dark).
- The usual pairs: `bg-white → dark:bg-slate-900`, `bg-gray-100 → dark:bg-slate-800`,
  `text-gray-700 → dark:text-slate-200`, `text-gray-500 → dark:text-slate-400`,
  `border-slate-200 → dark:border-slate-700`, `text-royalBlue → dark:text-slate-100` (as heading text),
  and the status tints (`bg-emerald-50 → dark:bg-emerald-950/40`, `text-emerald-700 → dark:text-emerald-300`,
  …). `bg-royalBlue`/`bg-brightTeal` fills with white text are left alone.
- The shadcn `.dark` variables in `globals.css` are retinted to the mobile app's navy palette
  (background `#0B1220`, card `#111A2E`, border `#24304A`, text `#E6EBF5`); `:root` is untouched.
  `tailwind.config.ts` uses `darkMode: ["class"]`.
- Recharts takes colours as props, not classes, so `IndustryInsights` reads `resolvedTheme` and passes dark
  axis/grid/tooltip/line colours — every override is `undefined` in light, leaving Recharts on the exact
  defaults it had.
- The Navbar carries the System/Light/Dark toggle (`ThemeToggle`) on desktop and in the mobile menu, plus the
  compact stock search box (`NavbarSearch`, which hands its term to `/[lang]/stocks?q=`).

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
`expo-web-browser`, `react-native-markdown-display` (announcement Markdown — pure JS, so OTA-safe),
`expo-system-ui`, native Google/Apple sign-in. App `1.0.1`, iOS build `1`, Android `versionCode 4`,
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
│   │   ├── home.tsx        # + stock search bar and the "My watchlist" section
│   │   ├── news/           # list + [id]; the list has THREE segments:
│   │   │                  #   News | Daily updates | Announcements
│   │   │                  #   reads ?tab=&date= params (also when already mounted)
│   │   ├── breakthroughs/  # list + [id]   (promoted to a tab)
│   │   ├── chat/           # conversations list + [conversationId]
│   │   ├── daily-updates/  # [id] only — hidden tab (href: null), reached from News
│   │   ├── announcements/  # [id] only — hidden tab (href: null), Markdown detail
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── stocks/search.tsx   # Stock search — stack screen, NOT a 7th tab
│   ├── stock/[symbol].tsx  # Stock page — stack screen; every symbol chip links here
│   ├── settings/        # index (incl. delete-account flow), language, appearance, about
│   ├── edit-profile.tsx, notifications.tsx
│   └── _layout.tsx / index.tsx
├── services/            # api, auth, news, breakthroughs, dailyUpdates, chat, notifications,
│                        #   stocks, watchlist, announcements
├── hooks/               # useChat, useContent, useNotifications, useStocks
├── stores/              # auth.store.ts, ui.store.ts, theme.store.ts
├── lib/                 # socket, notifications, rtl, bidi, day, format, navigation,
│                        #   i18n-content, stockLink, theme, googleSignIn, appleSignIn
├── i18n/, locales/      # en.json / ar.json
├── constants/           # api.ts (ALL endpoint paths), colors.ts, storage-keys.ts
└── types/               # api.ts, content.ts, navigation.ts, user.ts
```

### 4.4 Mobile API surface actually used by the app
`auth` (login/register/verify/refresh/logout/forgot/reset/google/apple) · `me` (+ `me/language`;
`DELETE me` = account deletion) · `news` (+ `[id]`, `?symbol=` filter) · `breakthroughs` (+ `[id]`) ·
`daily-updates` (+ `[id]`, `available-dates`) · `market/[symbol]` · `push-token` ·
`notifications` (+ `[id]/read`, `unread-count`, `read-all`) · `chat` (conversations, messages, `messages/[id]/read`) ·
`uploads/chat` · `stocks/search` · `stocks/[symbol]` · `watchlist` (GET/POST, + `[symbol]` DELETE/PATCH) ·
`announcements` (+ `[id]`).

The same reads exist for the web app under `/api/stocks/*`, `/api/watchlist/*` and `/api/announcements/*`
(NextAuth via `getAuthUser` / `getOptionalAuthUser`; search, stock detail and announcements are public, the
watchlist needs a session). Both sets are thin wrappers over `src/modules/stocks/stocks.service.ts` — don't
duplicate the SQL.

**Still served but unused by the app:** `signals` (+ `[id]`, `history`), `elite/*` (apply, status, dashboard,
portfolio, trade-plans, executions, close-requests, firm-profit-payments, bank-accounts, payment-handoff).

**Rule of thumb:** every mobile-visible feature has a matching admin surface under
`src/app/api/admin/mobile/**` (broadcasts, conversations, groups, uploads, users).

### 4.5 Theming (light + dark)

- **Light mode is frozen.** `constants/colors.ts` keeps the original palette value-for-value as
  `lightColors`; `darkColors` carries **the same keys** with a navy dark palette. `Colors` remains exported
  as the light palette so nothing older breaks. Changing a light value is a visual regression, not a tweak.
- Two keys exist for semantic reasons and have the **same light value** as the token they split from, so
  light rendering is untouched:
  - `surface` — a white *surface* (card, app bar, tab bar). Light `#FFFFFF`, like `white`; dark is the
    raised navy. `white` is only for text/icons **on a brand-coloured fill**, where it must stay white.
  - `primaryText` — brand-coloured *text and icons* on a surface (titles, symbol pills, chevrons,
    spinners). Light `#0A2472`, like `primary`; dark is a light blue, because the dark `primary` is a fill
    colour and would be unreadable as text.
- **Every themed file follows one pattern**: `const makeStyles = (c: AppColors) => StyleSheet.create({...})`
  at module level, and inside the component
  `const { colors } = useTheme(); const styles = useMemo(() => makeStyles(colors), [colors]);`.
  Inline colour props read `colors.x`. No file imports `Colors` any more.
- `lib/theme.tsx` holds `ThemeProvider` / `useTheme()` (`{ colors, scheme, mode, setMode }`) plus
  `currentColors()` for the class-based `ErrorBoundary`. The chosen mode (`system` | `light` | `dark`,
  default `system`) lives in `stores/theme.store.ts`, persisted in SecureStore under `STORAGE_KEYS.THEME` —
  the same mechanism as the language — and is hydrated in `app/_layout.tsx` alongside i18n and auth so the
  first frame is already in the right scheme.
- The navigator is wrapped in React Navigation's own `ThemeProvider` (built from our palette) so screen
  transitions don't flash white, and `StatusBar` follows the **resolved** scheme, not the device's.
- `app.json` sets `"userInterfaceStyle": "automatic"` with the `expo-system-ui` plugin, so **dark mode needs
  a new native (EAS) build** — it cannot ship as an OTA update. The JS is safe on an older binary anyway:
  there `useColorScheme()` just returns `light`, so `system` resolves to light while the explicit Light/Dark
  options keep working.
- Known asset limitation: `assets/icon-header.png` is a navy logo mark drawn for a white app bar, so it
  loses its navy strands on the dark app bar. The asset itself is unchanged — it needs a light variant.

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

### Stocks, watchlists & announcements
- `stocks` — the **covered universe** (US biopharma only): `symbol` (PK, always UPPER), `name_en`,
  `name_ar`, `is_active`. Stock search runs against this table **and nothing else**, so an uncovered ticker
  is simply not findable. Seeded from existing content symbols by the migration, then kept filled by
  `ensureStocks()` (`src/modules/stocks/stocks.service.ts`), which every admin content insert calls inside
  its own transaction. `ensureStocks` is `INSERT … ON CONFLICT DO NOTHING`, so an admin-corrected name is
  never overwritten.
- `user_watchlist` — `(user_id, symbol)` PK plus `alerts_enabled`. Capped at **50 symbols per user**
  (enforced in the insert statement itself; routes answer `WATCHLIST_LIMIT`).
- `company_announcements` — bilingual **Markdown** announcements per symbol: `title_en/ar`,
  `content_en/ar` (the `_en` side is the verbatim original), `source_url`, `announced_at`,
  `published_date`. Both clients render the Markdown with raw HTML disabled.
- All stock/watchlist SQL lives in `src/modules/stocks/stocks.service.ts`; web and mobile routes are thin
  wrappers over it.

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
`bank_transfer_payments.sql` → **`apple_refresh_token.sql`** → **`path_log.sql`** → **`auth_log.sql`** →
**`stocks_watchlist_announcements.sql`**.

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
  The mechanism: `routeForNotification(data)` in `mobile/lib/notifications.ts` maps `data.screen` to a
  route (`chat`, `daily-updates`, `announcement`, `breakthrough`, `stock`) and sends **everything else to
  `/notifications`** — so a signal push has a valid destination (the Notifications tab, where its
  bilingual title/body from `in_app_notifications` is readable) rather than dead-ending on a deleted
  route. **Keep that `default` branch.** The same function serves push taps (foreground, background and
  cold start, the last via `getLastNotificationResponseAsync` once auth has hydrated) and taps on a row in
  the Notifications tab, so the two can never disagree.
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
- **Theme-aware styles (mobile).** Never import `Colors` in a screen or component: use
  `makeStyles(c: AppColors)` + `useTheme()` (§4.5). A white surface is `surface`, brand text is
  `primaryText`, and `white` is reserved for text on a brand fill. Light values never change.
- **Realtime chat** goes through `src/lib/socket/socket-server.ts`; `server.ts` (not `next dev`) must run.
- **Push notifications** are server-side only, via `src/lib/services/push.service.ts`.
- **One notification per user per publish event.** Content alerts fan out through
  `src/lib/services/content-alert.service.ts` (`notifyWatchers`, `notifyAllDailyUpdates`): a bulk insert of
  ten rows, or an announcement touching three symbols one user watches, produces **one** notification for
  that user — the affected symbols are named in the body ("MRNA, PFE, LLY +4 more") instead of sending one
  per row. Call it **once per request, after `COMMIT`, fire-and-forget**
  (`void notifyWatchers(...).catch(logAlertFailure(...))`) so a push failure can never fail an admin publish.
  Daily updates already go to everyone, so they do **not** also fire watchlist alerts.
- **Admin → everyone notifications** (`/admin/notifications` → `POST /api/admin/notifications`) are the
  general-purpose announcement tool: the admin writes title+body in **both** languages, the rows are written
  with `insertNotificationForAllUsers` (awaited, so the admin sees a real recipient count) and the pushes go
  out fire-and-forget. Type `admin_message`, no `screen` in the payload — so a tap lands on the Notifications
  tab through mobile's `default` branch (§6).
- **Logging must never break the request it logs.** `path_log` and `auth_log` writes are fire-and-forget
  (`.catch()` / try-swallow) and must not hold a pooled connection across the response.
- **Mobile-to-web handoff pattern** (§4.2) is the template for any future flow that can't run natively: mint a
  single-use hashed token server-side, open it in `expo-web-browser`, consume it via a public NextAuth
  credentials provider + a dedicated public landing page.
- **Announcements are a segment of the News page, not a nav item** — on both clients. Web:
  `NewsSection` has three tabs (News | Daily Updates | Announcements); mobile: the News tab has the same
  three segments. The standalone `/[lang]/announcements{,/[id]}` pages stay for SEO, the sitemap and deep
  links, but nothing links to them from the Navbar.
- **Searching for a stock by symbol happens in the News feed**, on both clients: an input + Search +
  Clear that filters news by a partial, case-insensitive symbol match (`/api/news?symbol=` on web,
  `/api/mobile/v1/news?symbol=` on mobile). There is no stock-search box in the Navbar.
- **Stock pages, search and announcements are public; the watchlist is not.** `/[lang]/stocks`,
  `/[lang]/stocks/[symbol]` and `/[lang]/announcements{,/[id]}` are SSR'd (`revalidate = 300`) and listed in
  `sitemap.ts` (including one URL per announcement and per active stock). `/[lang]/watchlist` is in
  `PROTECTED_ROUTES` and `noindex`. A guest pressing Watch gets the existing `AuthModal`, which now also
  opens on a `window.dispatchEvent(new Event("openAuthModal"))`.
- **Store links** for "Get the app" buttons live in **one** place: `src/config/app-store.ts`, overridable by
  `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL`. Both stores are live (Apple ID `6797457921`,
  Android package `com.biopharmastock.app`). The iOS link is intentionally storefront-less so Apple
  redirects each visitor to their own country's store.
