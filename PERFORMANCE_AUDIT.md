# PHARMAsTOCK Performance & Concurrency Audit

**Date:** 2026-07-25
**Scope:** `./pharma-stock` (Next.js web app + API/backend) and `./mobile` (Expo app)
**Type:** Read-only audit. No code was modified as part of this exercise.
**Method:** Five parallel research passes over the live source tree (cross-referenced against `final-final-schema.sql`), one per category below, each citing real `file:line` locations it actually read. Positive/negative results ("this code is already safe") are included alongside findings, not just bugs — accuracy of the overall picture matters more than finding count.

---

## Remediation status (as of 2026-07-26)

The findings below were reviewed and triaged. Fixes for the approved items have already been applied to the codebase (this file was **not** updated to remove the original findings — they're kept as-written for historical record; this section tracks what's actually been done since).

**Fixed:**
- **Critical #1** (`PATCH /api/elite/portfolio` capital overwrite) — replaced with an admin-approval flow. New table `capital_change_requests` (migration `pharma-stock/migrations/capital_change_requests.sql` — **not yet applied to the DB, needs `psql $DATABASE_URL -f pharma-stock/migrations/capital_change_requests.sql`**). Investor submits a request via the same endpoint; only `PATCH /api/admin/capital-requests/[id]` (new) actually calls the capital-update code. New admin page at `/admin/capital-requests`.
- **Critical #3** (`admin/signals` GET released-client reuse) — fixed. Also uncovered and fixed a related latent bug: the "auto-close a signal when its target is hit" path was silently non-functional (it self-invoked the DELETE handler via a synthetic request with no auth cookie, which 401'd every time) — signals were never actually being auto-closed/archived. Now works via a shared internal function.
- **High #5 / #6** (connection-pool leaks + missing pagination) — ~15 route files fixed (leaked a pooled DB connection on error paths — several on common cases like an invalid password-reset token). Pagination added to `admin/breakthroughs`, `admin/daily-updates`, `admin/users` (defaults preserve today's behavior).
- **High** (mobile refresh-token queue hang) — `mobile/services/api.ts` now rejects queued requests when a token refresh fails, instead of hanging forever.
- **Race condition** (duplicate PENDING close-request submissions) — `program.service.ts`'s `requestInvestorClose`/`requestAdminClose` now transaction + row-locked.
- **Medium** (Elite investor dashboard raw `fetch`) — converted to `useSWR`.
- **Medium** (`QuotesService` cache never read) — now reads `price_cache` first, only calls the provider for stale/missing symbols.
- **Medium** (admin chat page polling instead of Socket.IO) — fixed. **Security-relevant: this required adding a second authentication path into the Socket.IO server** (`src/lib/socket/socket-server.ts`) — the admin web panel previously had no way to authenticate a socket connection at all (only mobile JWT access tokens were accepted). Browser admin sessions now authenticate via their existing NextAuth session cookie, decoded server-side with `next-auth/jwt`'s `decode()` and `NEXTAUTH_SECRET`, checked for `role === 'admin'`, then joined to a socket.io `'admin'` room. **This is new auth-adjacent code and worth a dedicated look from the security review** — specifically: the cookie-name parsing in `extractNextAuthSessionCookie()`, the `getAdminSocketAuth()` function, and the CORS/`credentials: true` config in `server.ts` that allows cookies to be sent on the socket handshake. Added `socket.io-client` as a new npm dependency in `pharma-stock/package.json`.

**Explicitly left alone / deferred (not fixed, by user decision):**
- Critical #2 — the disabled Stripe subscription webhook and 4 related subscription routes (all filed as `_route.ts`, so Next.js never registers them — no live code path currently creates/renews a subscription in this repo snapshot). **Flagging for the security review too**: if subscription billing is somehow live via a mechanism not visible in this repo, that changes the risk profile; if it's genuinely dead, it's a business-continuity gap, not a security one, but worth independent confirmation either way.
- Critical #4 — `/api/home-page-prices` cache stampede (marketing homepage only, not a data-integrity risk).
- High #9, #11 — homepage bundle code-splitting; Socket.IO multi-instance adapter + in-process rate limiters (only a risk once horizontally scaled — confirmed single-instance deploy today).
- Medium #12, #13, #14(partially — see above) — partner-payout race (no live approval endpoint exists yet, so not currently exploitable), residual-session-after-account-deletion window (stateless JWT design tradeoff).
- Low #16–24 — all deferred (signal-price-refresh non-atomic claim, `SimplePriceCacheService` narrow stampede window, missing index on `resettokens.token`, minor UI/comment nits, etc.)

**New files added:** `pharma-stock/migrations/capital_change_requests.sql`, `pharma-stock/src/app/admin/capital-requests/page.tsx`, `pharma-stock/src/app/api/admin/capital-requests/route.ts` (+ `[requestId]/route.ts`), `pharma-stock/src/app/api/elite/capital-requests/route.ts`, `pharma-stock/src/lib/adminChatSocket.ts`.

**Files touched for the leak/pagination sweep** (mechanical fixes only, no logic changes): `admin/breakthroughs`, `admin/daily-updates`, `admin/history`, `admin/subscriptions`, `admin/users`, `auth/forgot-password`, `auth/register`, `auth/resend`, `auth/reset-password`, `community`, `daily-updates` (public), `history` (public), `news` (public) — all under `pharma-stock/src/app/api/`.

---

## Executive summary — top risks

| # | Finding | Severity | Section |
|---|---|---|---|
| 1 | `PATCH /api/elite/portfolio` lets an investor overwrite their own `current_capital_amount` to an arbitrary absolute value, and it races with real trade-execution capital updates | **Critical** | 1A.1 Finding 1 |
| 2 | Core Stripe subscription webhook (`payments/webhook`) and 4 related subscription routes are filed as `_route.ts` — **not live** in Next.js App Router. No confirmed code path creates/renews a subscription today. | **Critical** | 1A.2 |
| 3 | `admin/signals GET` retains and reuses a `pg` `PoolClient` **after** calling `client.release()`, risking cross-request query interleaving on that connection | **Critical** | 2.1 |
| 4 | `/api/home-page-prices` in-memory cache has no stampede protection — every request during the ~2h expiry window independently fires a 10-call sequential upstream loop | **Critical** | 3 |
| 5 | 16 of 40 files using `pool.connect()` never `client.release()` on the error path (no `finally`) — a burst of failed requests can exhaust the pool app-wide | **High** | 2.3 |
| 6 | `QuotesService.getQuotes` (backs `/api/market/quotes`) never reads its own `price_cache` table — the cache is write-only dead code, so this endpoint has zero caching benefit | **High** | 3 |
| 7 | Admin `breakthroughs`/`daily-updates` list endpoints run unbounded `SELECT *` with no `LIMIT`/pagination | **High** | 2.4 |
| 8 | Mobile refresh-token queue never rejects queued requests when a refresh fails — they hang forever instead of surfacing the auth failure | **High** | 1B.1 |
| 9 | Recharts+framer-motion `IndustryInsights` component ships unsplit in the public homepage bundle (highest-traffic route, no `next/dynamic` used anywhere in the app) | **High** | 5 (Web) |
| 10 | Socket.IO has no multi-instance adapter and rate limiters are in-process `Map`s — both fine today (confirmed single-instance deploy) but will silently break/under-enforce the moment the app is horizontally scaled | **High if scaled** | 4 |

Everything below is the full detail behind these and the rest of the findings, organized by the audit's original six categories.

---

## 1. Race Conditions & Data Integrity

### 1A. Elite Program, Trade & Payment Race Conditions

**Scope covered:** `program.service.ts` (4155 lines — full grep of every `async`/`BEGIN`/`FOR UPDATE` site plus targeted reads), `src/app/api/admin/signals/route.ts`, `src/app/api/stripe/program-webhook/route.ts`, `src/app/api/payments/webhook/_route.ts`, `src/app/api/elite/portfolio/route.ts`, `src/app/api/admin/partners/[partnerId]/route.ts`, `src/app/api/admin/payouts/route.ts`.

#### 1. Elite portfolio / trade concurrency

**Solid patterns found (negative results, for accuracy):**
- `submitTradeExecution` (program.service.ts:1753‑1901), `forceClosePositionByInvestor` (2133‑2245), `forceClosePositionByAdmin` (2247‑2345), `forceOpenTradePlanByAdmin` (2347‑2517) all wrap their read-then-write in `BEGIN`/`COMMIT` with `SELECT ... FOR UPDATE` on the portfolio/plan/position rows they touch, and re-check state (status, existing execution, free capital) after acquiring the lock. Two concurrent admins force-executing the same plan, or an admin + investor force-closing the same position simultaneously, correctly serialize: the second transaction blocks on the row lock, then re-reads fresh state and cleanly errors ("Execution already exists", "Trade plan cannot be force opened...").
- Free-capital mutations via `adjustFreeCapital` (1502‑1531) use `UPDATE elite_portfolios_simple SET current_capital_amount = current_capital_amount + $delta ... RETURNING current_capital_amount` — a single atomic statement, not read-then-write, so it's race-safe by construction even without extra locking.
- `allocateFirmProfitPayment` (1405‑1471) locks the payment row `FOR UPDATE`, checks `status !== 'PAID'`, and checks for existing allocation rows before inserting — correctly idempotent against being called twice for the same payment.
- `executeApprovedClose` (2589‑2732) locks both the close-request and position rows (`FOR UPDATE OF pcr, pps`) and re-validates `requestedQuantity > quantityOpen` against the freshly-locked value, so even when two close-request rows exist for the same position (see Finding 2 below), the second one *approved* fails safely rather than over-closing or double-crediting capital.
- `reviewPartner` (783‑850) and `reviewInvestorApplication` (954‑1084) both lock the row `FOR UPDATE` before transitioning status — two admins approving the same partner/application concurrently serialize correctly.

**Finding 1 — Critical: investor-controlled absolute capital overwrite (`PATCH /api/elite/portfolio` → `updateCurrentCapital`)**
- File: `program.service.ts:1533‑1555` (`updateCurrentCapital`), called from `src/app/api/elite/portfolio/route.ts:21‑33` (`PATCH`), authenticated as the investor themselves.
- The handler takes a **client-supplied absolute number** (`body.currentCapitalAmount`) with no validation against the investor's actual investment/subscription, reads stale context via `getInvestorContext` (no lock), then in a separate transaction calls `setFreeCapital` (1473‑1500), which does a blind `UPDATE elite_portfolios_simple SET current_capital_amount = $2` (overwrite, not delta) and mirrors it onto `elite_members`.
- Concrete interleaving:
  1. Investor's trade execution (`submitTradeExecution`) begins, locks the portfolio row `FOR UPDATE`, reads capital = $10,000.
  2. Concurrently, the same investor calls `PATCH /api/elite/portfolio` with `currentCapitalAmount: 10000` (a stale value cached in their own client from before the trade).
  3. Trade execution transaction commits: `adjustFreeCapital` decrements capital atomically to $7,000 (after a $3,000 buy) and marks the plan `EXECUTED`.
  4. The `PATCH` transaction (which never took a lock) commits, **overwriting capital back to $10,000** — silently erasing the $3,000 the trade actually spent.
  - Even without the race, this endpoint lets any elite investor set their own `current_capital_amount` to an arbitrary value (e.g. `999999999`) at any time and then use it as spendable capital for real trade executions — a business-logic/authorization defect independent of concurrency, which compounds the race above.
- **Fix:** remove/lock down this endpoint (capital should only ever be admin-set or delta-adjusted by trade/close flows). If a legitimate "top-up" use case exists, replace the absolute overwrite with `adjustFreeCapital`-style atomic delta plus admin authorization, not investor self-service.

**Finding 2 — Medium/High: duplicate PENDING close requests via check-then-insert race**
- Files: `requestInvestorClose` (2519‑2587) and `requestAdminClose` (2956‑3019) — both do a plain `pool.query` "is there already a PENDING request for this position" `SELECT`, then a separate un-locked `INSERT`, then a separate `UPDATE ... WHERE status IN ('OPEN','PARTIALLY_CLOSED')`. None of this runs inside a transaction or under a row lock (contrast with `forceClosePositionByInvestor`/`Admin`, which correctly lock the position row first).
- Concrete interleaving (investor double-taps "Request Close" on position #501, 100 shares open):
  1. Request A: `SELECT ... WHERE position_id=501 AND status='PENDING'` → no rows.
  2. Request B (near-simultaneous): same `SELECT` → no rows (A hasn't inserted yet).
  3. Request A: `INSERT position_close_requests` → id 901, PENDING, qty 100.
  4. Request B: `INSERT position_close_requests` → id 902, PENDING, qty 100.
  5. Request A: `UPDATE portfolio_positions_simple SET status='PENDING_CLOSE'` → succeeds.
  6. Request B: same `UPDATE` → no-op, but request 902 already exists.
  - Result: two PENDING close-request rows for the same position. When admin approves #901, `executeApprovedClose` closes it fully. When admin tries to approve #902, the `FOR UPDATE`-protected quantity check correctly throws `"Close quantity exceeds open quantity"` — **no double-credit of capital occurs** — but #902 is left permanently stuck in PENDING with no clean resolution path, and the admin gets a confusing failure trying to process what looks like a valid request.
- **Fix:** wrap the check + insert + position-status-update in a single transaction with `SELECT ... FOR UPDATE` on the position row (matching `forceClosePositionByInvestor`'s pattern), or add `CREATE UNIQUE INDEX ON position_close_requests(position_id) WHERE status = 'PENDING'` as a DB-level backstop (same pattern already used for `ux_signals_symbol_upper`).

**Finding 3 — Medium: partner payout request over-commitment via stale read**
- File: `createPartnerPayoutRequest` (3823‑3884). Computes `availableToRequestAmount` via a plain read (no lock), then inserts a new `partner_payout_requests` row if the caller-specified amount is `<= availableToRequestAmount`, with no re-check under lock and no cap on total PENDING requests.
- Two concurrent submissions can both read the same `availableToRequestAmount` before either INSERT commits, and both pass the check, producing two PENDING requests against capacity for only one.
- **Mitigating context:** no live admin route was found that transitions `partner_payout_requests` out of `PENDING` (`src/app/api/admin/payouts/route.ts` is unrelated; a full grep for review/approve handlers on this table found nothing). So today this can't cause a duplicate real-money payout — but the race is real and becomes exploitable the moment a review/approve endpoint is added.
- **Fix:** lock the partner's existing PENDING requests inside a transaction before computing availability and inserting, before any approval endpoint is built.

#### 2. Stripe webhook idempotency

**Elite firm-profit webhook — solid.** `src/app/api/stripe/program-webhook/route.ts` routes `checkout.session.completed`/`async_payment_succeeded` to `finalizeFirmProfitPaymentFromStripe` (program.service.ts:3749‑3806), which locks the payment row `FOR UPDATE` and returns early `{ alreadyProcessed: true }` **before** applying any effect if `status === 'PAID'` — correctly idempotent against Stripe's at-least-once delivery. `checkout.session.expired` → `expireFirmProfitPaymentFromStripe` (3808‑3821) uses `SET status = CASE WHEN status = 'PAID' THEN status ELSE 'EXPIRED' END`, correctly protecting against out-of-order delivery too.

**Critical finding — the main subscription/payment webhook and its entire supporting API are disabled, not just non-idempotent.**
- `src/app/api/payments/webhook/_route.ts` — the handler for `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` is filed as **`_route.ts`** with its whole body block-commented. Next.js App Router only registers a file literally named `route.ts`; `_route.ts` is inert and registers no endpoint.
- No live replacement was found: `src/app/api/payments/payment/_route.ts`, `src/app/api/subscriptions/_route.ts`, `src/app/api/subscriptions/cancel/_route.ts`, `src/app/api/subscriptions/history/_route.ts`, `src/app/api/subscriptions/status/_route.ts` are **all** disabled the same way. A grep of every live `route.ts` under `src/app/api` for `stripe`/`subscriptions` turns up only `admin/subscriptions/route.ts` (admin *read* endpoint) and `mobile/v1/me/route.ts`. There is no live code path in this snapshot that creates a Stripe Checkout session for a subscription package or processes subscription webhook events.
- This can't be resolved from the code alone — it needs a direct answer from the team on whether this is a deliberate mid-migration pause or an accidental regression, since it changes the actual production risk profile (if live in production via infra not present here, the idempotency analysis doesn't apply; if not, subscriptions/renewals aren't currently being recorded at all).

#### 3. Signals unique-open-signal-per-symbol race — already safe (informational)

`src/app/api/admin/signals/route.ts` `POST` (33‑129) does an app-layer check-then-insert (`SELECT` at line 63, `INSERT` at line 82) with no transaction/lock, so two concurrent admin requests for the same symbol can both pass the check. However, the `INSERT` is wrapped in a `try/catch` that specifically detects Postgres error code `23505` (unique violation on `ux_signals_symbol_upper`) and returns a clean `409` (lines 92‑103) rather than an unhandled 500. **This is correct, intentional design — DB unique index as the real guarantee, app-layer check only for the fast-path UX. No fix needed.**

*(Adjacent connection-leak note on this same handler's `GET`, not `POST`, is covered under §2.1/§2.3 below.)*

---

### 1B. Auth & Token Race Conditions

#### 1. Mobile refresh-token flow

**Client-side de-dup (`mobile/services/api.ts:8‑79`) — safe, correctly implemented.** The `isRefreshing` flag is checked and set *synchronously* before the first `await`. Since JS/RN is single-threaded, two 401s handled back-to-back cannot both pass `if (isRefreshing)` — the second is queued via `refreshQueue.push(...)` instead of firing its own `/auth/refresh` call. Correct single-flight pattern.

**Finding — High: queued requests hang forever if refresh fails.** `mobile/services/api.ts:69‑77`:
```js
} catch {
  refreshQueue = [];                         // line 70
  await SecureStore.deleteItemAsync(...);
  return Promise.reject(error);
} finally {
  isRefreshing = false;
}
```
When the in-flight refresh call throws (expired/revoked refresh token, network error), `refreshQueue` is reassigned to `[]`. The callbacks already pushed each wrap a `new Promise((resolve) => { refreshQueue.push(cb) })` with **no `reject` path** — clearing the array without invoking those callbacks means every request queued behind the failed refresh **never resolves or rejects**. In the UI this manifests as requests silently hanging (infinite spinner) instead of surfacing the auth failure, exactly when the user most needs to be redirected to login.
- Severity: **High** — very plausible under any expired/logged-out session with ≥2 concurrent API calls in flight.
- **Fix:** track queued callbacks as `{resolve, reject}` pairs and call `.reject(error)` for each in the `catch` block instead of discarding them.

**Server side (`pharma-stock/src/app/api/mobile/v1/auth/refresh/route.ts`) — no rotation, so no invalidation race, but also no reuse detection.** The handler only `SELECT`s the token row and never rotates/revokes it; it mints a fresh access token and returns. No `UPDATE`/`DELETE` against `mobile_refresh_tokens` in this path.
- Concurrency-wise this is safe: N concurrent calls with the same valid refresh token just produce N valid access tokens; none can invalidate another's in-flight request.
- Design gap (not a race, worth a Low/Medium security note): because the refresh token is a static, long-lived (30d) bearer credential with no rotation-on-use and no reuse/theft detection, a captured refresh token is valid for its full TTL regardless of how many times it's used — normal use is indistinguishable from replay.

#### 2. Mobile-web handoff tokens — safe, correctly implemented

`pharma-stock/src/lib/nextAuth.ts:121‑127` (inside `mobile-handoff`'s `authorize`):
```sql
UPDATE mobile_web_handoff_tokens
SET consumed_at = NOW()
WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
RETURNING user_id, redirect_path
```
This is the atomic consume-on-write pattern the audit was checking for — no separate SELECT-then-UPDATE. Two concurrent requests with the same raw token race at the row-lock level: Postgres's MVCC serializes the two `UPDATE`s, so only one can match `consumed_at IS NULL`; the second returns zero rows → `authorize` throws → the client's `!result?.ok` branch (`src/app/handoff/page.tsx:32‑35`) shows "already used." No double sign-in, no double-triggered payment flow. Token creation (`src/app/api/mobile/v1/elite/payment-handoff/route.ts:51‑59`) is a plain `INSERT` with a random 32-byte token and a 2-minute TTL — no issues. **No fix needed; include as a positive result.**

#### 3. Account deletion transaction

`pharma-stock/src/app/api/mobile/v1/me/route.ts:180‑241`, the `DELETE` handler:

**Transactional integrity — safe.** The whole operation runs on a single checked-out client wrapped in `BEGIN`(191)/`COMMIT`(229), `ROLLBACK` on any thrown error (232), and `client.release()` in `finally`(238‑240). A mid-operation failure rolls back everything — the `users` row is never left partially anonymized while tokens are already deleted, or vice versa. The initial read also takes `SELECT ... FROM users WHERE id = $1 FOR UPDATE` (193‑197), correctly serializing concurrent `DELETE /me` calls against each other.

**Finding — Low: double-submit produces a duplicate `deleted_accounts` row.** If the client fires `DELETE /me` twice in quick succession, the second transaction blocks on the lock, then commits, then re-reads the already-anonymized row and re-runs the full sequence — inserting a **second** `deleted_accounts` row for the same `original_user_id` with all PII fields already `NULL`. No FK/constraint violation (no unique index on `original_user_id`), so this is data-hygiene noise, not corruption.
- **Fix:** make `DELETE` idempotent — check if the user is already anonymized (e.g. `email LIKE 'deleted-user-%'`, or add a `deleted_at` column) and short-circuit with the existing success response.

**Finding — Medium: residual-session / half-deleted-user business-logic risk (not a DB race).** `verifyAccessToken` (`src/lib/mobile/jwt.ts:39‑66`) is purely stateless — signature + `exp` only, no DB lookup, no revocation check. Deleting `mobile_refresh_tokens` prevents *future* refreshes but does nothing to an access token already held by a device.
- Interleaving: Device A holds a still-valid (≤15 min) access token. User deletes their account → `users` row anonymized. Seconds later, a queued/in-flight request on the same or another logged-in device (a trade-plan accept, a payment-handoff request) reaches an authenticated route with the same access token; `verifyAccessToken` passes on signature/exp alone, and the request mutates data attributed to a now-anonymized user. Not a DB-corruption race (no constraint violated), but a genuine audit-trail/business-logic gap: financially/legally meaningful actions can be recorded against an account the user believes is deleted, for up to the full access-token TTL after anonymization.
- **Fix (pick one):** (a) add an indexed anonymized-state check to the mobile auth middleware, closing the gap immediately at a small per-request latency cost; (b) shorten `ACCESS_TOKEN_TTL` to bound the window as a documented tradeoff; (c) maintain a lightweight denylist (Redis or similar) of just-anonymized user IDs, checked only when present.

---

## 2. Database Performance

### 2.1 Query patterns / N+1

**Critical — use of a released `pg` client causes cross-request query interleaving (`src/app/api/admin/signals/route.ts:282‑316`).** In `GET`, the client is fetched, queried, and `client.release()`d at 282‑285. Then, for admin users, the code **re-uses that already-released client** inside a `Promise.all` loop over every signal (289‑316): `client.query(updateQuery, …)` at 299, an external `fetchCurrentPrice` call per signal (291), and a recursive self-invocation of the module's own `DELETE` handler with a hand-built `NextRequest` (305) for any signal whose target was hit — that recursive `DELETE` does its own independent `pool.connect()`/`release()`.

Calling `.query()` on a `PoolClient` after `release()` is undefined behavior: node-postgres has already returned the underlying socket to the pool, where a **different concurrent request** may already have checked it out. Two requests' queries can be written to the same TCP connection out of order, with results potentially attached to the wrong caller. Only triggers on admin-authenticated `GET` (branch gated on `isAdmin`), but the admin signals list is fetched during routine admin dashboard polling.
- **Fix:** never retain a `client` reference past `release()`. Use `pool.query()` (auto-releasing) for the per-signal updates, or hold one client for the whole handler and release once in `finally`. Refactor the close logic into a shared service function both handlers call directly, instead of fabricating a `NextRequest` to re-invoke `DELETE`.

**Medium — sequential external N+1 against the upstream price provider (not the DB), same block.** The `Promise.all` in `admin/signals GET` (289‑316) fires one `fetchCurrentPrice` HTTP call per open signal concurrently — fine for the DB, but no batching/caching against the upstream provider. `src/app/api/home-page-prices/route.ts:32‑51` is worse: a **sequential** `for...await` loop issuing 10 blocking round-trips one after another (and `"JNJ"` appears twice in `STOCK_SYMBOLS`, lines 5‑13 — one call is pure waste).
- **Fix:** batch provider calls (FMP supports comma-separated symbols, already used elsewhere in `quotes.service.ts`) and use `Promise.all`; dedupe the symbol list.

**Fine — the read-heavy mobile/public endpoints already query well.** `mobile/v1/signals`, `mobile/v1/news`, `mobile/v1/daily-updates`, `mobile/v1/breakthroughs` each do exactly one `COUNT(*)` + one paginated `SELECT` via `Promise.all` — no N+1. `program.service.ts`'s `getInvestorContext`, `getInvestorDashboard`, `getInvestorPlans` use single JOIN/batch queries — `getInvestorPlans` (1635) correctly batches trade-plan messages with `WHERE trade_plan_id = ANY($1::int[])` instead of per-plan queries.
- Low note: `getInvestorDashboard`'s three follow-up queries (1561‑1585) run sequentially rather than via `Promise.all` — a couple extra round-trips of latency per dashboard load; easy fix.

### 2.2 Missing indexes

Cross-checked against the real `CREATE INDEX`/`CONSTRAINT` statements in `final-final-schema.sql` and the actual query shapes found in code — only genuinely-hot, confirmed-live gaps are listed as findings; hypothetical/unconfirmed ones are called out as such rather than flagged.

| Column | Used by | Indexed today? | Severity |
|---|---|---|---|
| `news.symbol` (`WHERE symbol ILIKE $1` with leading wildcard, `src/app/api/news/route.ts:20`) | not indexed | A plain btree wouldn't help a `%term%` ILIKE anyway — needs `pg_trgm` + GIN. Add only if search volume justifies it: `CREATE EXTENSION pg_trgm; CREATE INDEX idx_news_symbol_trgm ON news USING GIN (symbol gin_trgm_ops);` | Medium |
| `signals` symbol lookup (`WHERE UPPER(symbol)=UPPER($1)`) | **covered** by `ux_signals_symbol_upper` | fine, no action | — |
| `elite_members.user_id`, `partner_accounts.user_id`, `partner_investor_links.investor_user_id` | covered by `UNIQUE` constraints (auto-indexed) | fine | — |
| `resettokens.token` | literal password-reset lookup key | only `id` (PK) indexed, `token` is not | Low — table is naturally small/short-lived, but zero index support on the actual lookup key |
| `elite_applications.user_id`, `subscriptions.user_id`/`transactions.user_id` | no confirmed hot query found reading currently-*live* code (subscriptions routes are the disabled `_route.ts` files — see 1A.2) | unconfirmed, not flagged as a real finding | Unconfirmed |

Admin `breakthroughs`/`daily-updates` list queries have no `WHERE` clause at all (unbounded `SELECT *`), so there's no filter column to index — that's a pagination problem, covered in §2.4, not an indexing one.

### 2.3 Connection pool (`src/lib/db.ts`)

Pool config: `max: 20`, `idleTimeoutMillis: 30_000`, `connectionTimeoutMillis: 5_000` — a reasonable ceiling for one Node instance serving web + mobile traffic; no change needed to the number itself. The file already has a well-reasoned guard (comment + `global`) against a *different* leak mode (dev-mode hot-reload duplicating pools).

**High — systemic connection leak on error paths across many `pool.connect()`-based routes.** The pattern `const client = await pool.connect(); ...; client.release();` — release only at the end of the `try` block, **no `finally`** — appears in 16 of the 40 files using `pool.connect()` directly. Confirmed by reading:
- `src/app/api/admin/users/route.ts:12‑33` — release only reached if both queries succeed.
- `src/app/api/news/route.ts:13‑68`, `src/app/api/daily-updates/route.ts:13‑71` — same shape, and these are **public, high-traffic** routes.
- `src/app/api/admin/history/route.ts` (all 4 handlers), `src/app/api/admin/news/route.ts` (all 4 handlers), `src/app/api/admin/breakthroughs/route.ts`, `src/app/api/admin/daily-updates/route.ts`, `src/app/api/admin/signals/route.ts` (POST/PUT/DELETE), `src/app/api/admin/subscriptions/route.ts` — identical shape.

If a query throws mid-`try` (bad input, transient network blip, constraint violation), the `catch` returns a 500 **without ever calling `client.release()`**. Because the client was checked out via `pool.connect()`, `idleTimeoutMillis` doesn't reclaim it — that only reaps clients sitting idle in the pool's *free* list, not ones checked out and never returned. A leaked client is gone from the pool permanently until process restart. With `max: 20`, a burst of ~20 failed requests to any of these endpoints can exhaust the pool app-wide, at which point every `pool.connect()`/`pool.query()` anywhere queues behind the 5s `connectionTimeoutMillis` and starts failing — the exact "everything failed to load" symptom the `db.ts` file's own comment already anticipates, but from a different root cause than the one it guards against.
- **Fix (same shape everywhere):** wrap the existing body in `try { ... } finally { client.release(); }`. Simpler and lower-risk where no multi-statement transaction is actually needed (none of the affected routes use `BEGIN`/`COMMIT`): switch to `pool.query()` directly, which acquires/releases automatically per call and eliminates the leak class entirely.

**Fine — newer code already gets this right.** `src/app/api/mobile/v1/me/route.ts:189` (account deletion) and `src/app/api/mobile/v1/elite/portfolio/route.ts:46` both wrap `BEGIN`/work/`COMMIT`/`ROLLBACK` in `try {…} catch {…} finally { client.release(); }`. All 14 `pool.connect()` sites inside `program.service.ts` show matching connect/release/finally counts. The mobile v1 read endpoints don't use `pool.connect()` at all — they call `pool.query()` directly, leak-safe by construction, and are the pattern the leaky routes above should be converted to.

**Out-of-band observation (same root cause as 1A.2):** `src/app/api/subscriptions/**` and `src/app/api/payments/payment/_route.ts` / `src/app/api/payments/webhook/_route.ts` are all named `_route.ts`, not `route.ts` — none of these five endpoints, including the core Stripe payment webhook, are currently live/reachable in Next.js App Router.

### 2.4 Pagination

**High — unbounded, unpaginated `SELECT *` on growing tables in admin routes:**
- `src/app/api/admin/breakthroughs/route.ts:112` — `SELECT * FROM breakthroughs ORDER BY created_at DESC`, no `LIMIT`, no `WHERE`. Every admin breakthroughs-list load fetches the entire table.
- `src/app/api/admin/daily-updates/route.ts:92` — `SELECT * FROM daily_updates ORDER BY published_date DESC`, also unbounded **and**, unlike the public/mobile daily-updates endpoints, has no `published_date >= NOW() - INTERVAL '24 hours'` filter — fetches the entire historical table, which by design grows forever.
- `src/app/api/admin/users/route.ts:18` — hardcoded `LIMIT 10` with **no `OFFSET`/page param at all**. Not a performance risk (opposite problem) — the admin can never see users beyond the 10 most recently created. Flag as a functional gap alongside the performance note.
- **Fix:** add `LIMIT $n OFFSET $m` (or reuse the existing `parsePaginationParams`/`buildPaginationMeta` helpers in `src/lib/mobile/paginate.ts`, already used correctly by the public/mobile equivalents of these same endpoints) to all three.

**Fine — every other list endpoint checked paginates correctly at the SQL level.** `mobile/v1/signals`, `mobile/v1/news`, `mobile/v1/daily-updates`, `mobile/v1/breakthroughs`, `src/app/api/news/route.ts`, `src/app/api/admin/news/route.ts` (GET), `src/app/api/admin/history/route.ts` (GET) all use `LIMIT $n OFFSET $m` in SQL — no fetch-all-then-slice-in-JS pattern found anywhere.

---

## 3. Caching

**Critical — `/api/home-page-prices` has no stampede protection.** `src/app/api/home-page-prices/route.ts:21‑56`: a module-level `let cache: {data, timestamp} | null` with a 2-hour TTL. When `cache` is `null`/expired, the handler falls straight through to the fetch loop with no lock, no in-flight-promise guard, no re-check. If N requests land in the same window after expiry (plausible for a marketing homepage, especially right after a slow first request unblocks queued traffic), **every one of them independently executes the full 10-iteration sequential `for...await fetch(...)` loop** against FMP's `search-exchange-variants` endpoint — up to 10×N near-simultaneous upstream calls, each taking as long as 10 sequential round-trips, widening the stampede window further. Also burns FMP API quota unnecessarily.
- **Fix:** guard with a single in-flight promise (`inflight ??= fetchAndCache(); const data = await inflight; inflight = null;`) so concurrent callers await one shared fetch. Switch the internal loop to `Promise.all` and dedupe `STOCK_SYMBOLS` (contains `"JNJ"` twice).

**High — the DB-backed quote cache (`price_cache` / `QuotesService`) never actually reads its own cache; it always hits the upstream provider.** `src/modules/market-data/quotes.service.ts:28‑41` (`getQuotes`) unconditionally calls the provider (line 32) and only *writes* to `PriceCacheService` afterward (line 35) — it never calls `getCachedPrices()` first. A grep for `getCachedPrices` usage found **zero call sites** other than its own definition — dead code. Every caller (`src/app/api/market/quotes/route.ts:21`, `src/modules/market-data/signal-price-refresh.service.ts:55`) therefore hits FMP fresh on every invocation; `price_cache` serves no read purpose today (write-only audit log). `/api/market/quotes` has **zero caching benefit** — N concurrent requests for the same symbol always produce N upstream calls, not just at expiry boundaries.
- **Fix:** wire `getCachedPrices` into `getQuotes` (check freshness, only fetch stale/missing symbols) — the same pattern already correctly implemented next door in `SimplePriceCacheService.getQuotes` (see below). Alternatively, if `market/quotes` is meant to always be "live," remove the dead read path and the unread table to stop the confusion.

**Medium — `SimplePriceCacheService.getQuotes` (backs Elite portfolio/dashboard, `src/modules/program/price-cache.service.ts:19‑148`) has a narrower stampede window, not a fully solved one.** This one *does* read-through correctly (query `price_cache_simple` first, only re-fetch stale symbols, 60s TTL) — the right pattern, and the template for fixing `QuotesService` above. But there's still no lock: two investors' concurrent dashboard calls that both touch an overlapping symbol crossing the 60s boundary at the same moment will both compute the same stale-symbol list and both call the provider independently — a smaller-blast-radius version of the same stampede class. Lower severity because the write path is `ON CONFLICT DO UPDATE` (idempotent, no corruption) and the short TTL means the window recurs frequently rather than piling up.
- **Fix (optional given low real-world concurrency here):** a per-symbol in-flight map so overlapping stale-refresh requests for the same symbol await one shared fetch.

**Medium — the signal-price refresh "claim" write is a non-atomic check-then-write; the design comment overstates the guarantee.** `src/modules/market-data/signal-price-refresh.service.ts:24‑92`: reads `system_settings.last_price_update`, and if `<120s` old, writes a fresh timestamp *before* calling the provider (comment claims this prevents "duplicate provider calls"). True for requests arriving after that write commits, but two requests that both read the stale timestamp before either writes back (realistic under concurrent web + mobile traffic hitting `/api/signals` and `/api/mobile/v1/signals` simultaneously) will both pass the check and both call the provider. Low real-world impact (self-heals every 120s; subsequent `UPDATE signals SET price_now=$1` is idempotent/last-write-wins).
- **Fix:** atomic claim — `UPDATE system_settings SET value=$2 WHERE key=$1 AND value < $3 RETURNING *` (or `SELECT ... FOR UPDATE` on that row), only proceed to the provider call if the `UPDATE` actually returned a row.

**Staleness risk assessment (could a cached price mislead a trading decision?):**
- `price_cache_simple` (Elite positions/dashboard): 60s TTL, actively enforced on every read. Reasonable for portfolio valuation, not tick-by-tick trading. No finding.
- `mobile/v1/market/[symbol]/route.ts:12‑17`: reads `price_cache_simple` **directly**, with no TTL check and no trigger to refresh — returns whatever's in the table however old, with `fetched_at` in the response but no server-side staleness enforcement. If a symbol isn't currently held in any Elite portfolio (the only thing that populates this table), the endpoint can return arbitrarily old or entirely absent data. **Medium** — not corruption, but a client trusting `price` without checking `fetched_at` could display stale-but-plausible pricing.
  - **Fix:** call `SimplePriceCacheService.getQuotes([symbol])` from this route instead of a raw table read, or explicitly enforce/document a max-age.
- `home-page-prices`: 2h TTL is generous, but this is a homepage ticker of hardcoded large-cap names, not a trading surface — Low on staleness specifically (the stampede issue above is the real problem here).
- `signals.price_now`: refreshed at most every 120s and **is** shown as the live price against target/entry prices that drive open/close decisions. 120s staleness during fast-moving markets could plausibly mislead a "price now vs. target" comparison — **Medium**, but likely a deliberate product decision given signals aren't intraday-scalping tools rather than an oversight. Worth an explicit confirm, not a code fix.

---

## 4. Realtime & Scaling

**4.1 — No Socket.IO multi-instance adapter (forward-looking, not an active bug today).** `pharma-stock/server.ts:27‑36` creates a single `Server` instance directly on the HTTP server with no adapter option; `src/lib/socket/socket-server.ts:6,9,13` stores `io` on a per-process `global`, and rooms (`user:${userId}`, `conv:${conversationId}`) live only in that process's memory. No `@socket.io/redis-adapter` or similar exists in the repo. Deployment is confirmed single-instance: `captain-definition` builds one Docker image with `CMD ["npm", "start"]` — no PM2 cluster config, no nginx/proxy config, no sticky-session setup anywhere. **So this is currently fine.** It becomes a real bug only if/when deployed as 2+ replicas: a message emitted by the instance handling an admin's HTTP request would never reach a user socket connected to a different instance, so chat/notifications would silently fail for some fraction of users depending on load-balancer routing.
- Severity: **High if horizontally scaled, N/A today.**
- **Fix (before any multi-instance deployment):** add `@socket.io/redis-adapter` (or Postgres adapter) so rooms/broadcasts are shared, plus sticky sessions at the proxy layer for the long-polling fallback transport.

**4.2 — Adjacent correctness bug spotted in passing (not scaling/concurrency, flagging since it's directly adjacent code):** `io.to('admin').emit('new_user_message', ...)` appears at `socket-server.ts:67` and `src/app/api/mobile/v1/chat/conversations/[id]/messages/route.ts:95`, but a full grep for `.join(` in socket handling shows only `socket.join(\`user:${userId}\`)` and `socket.join(\`conv:${conversationId}\`)` — no code anywhere does `socket.join('admin')`. Real-time delivery of new-user-message events to the admin panel is dead code today, independent of instance count; the admin UI must be relying on polling (see §5, Web — admin messages page). Flagging for whoever owns functional correctness.

**4.3 — In-memory rate limiters won't survive horizontal scaling.** Both `src/lib/rate-limit.ts:6` (web login/handoff limiters) and `src/lib/mobile/rate-limit.ts:8` (9 confirmed call sites — mobile login, register, forgot-password, elite apply, elite payment-handoff, chat message, chat upload, broadcast-send) store counters in a plain in-process `Map`. No Redis/DB-backed store exists. Given the confirmed single-instance deployment (4.1), this is **not currently exploitable** — one counter, correctly enforced. But it's a silent Day-1 gap the moment the app scales to N instances: a client round-robined across instances gets up to N× the intended request budget, quietly defeating the brute-force protections the recent login-rate-limit work was meant to add.
- Severity: **High if horizontally scaled, Low/theoretical today.**
- **Fix:** swap the `Map` for Redis-backed `INCR`+`EXPIRE` (or a Postgres table) before adding replicas — do this alongside the Socket.IO adapter fix, since both share the same single-instance assumption.
- *Intra-process note:* within one process both limiters' `check()` functions are fully synchronous with no `await`, so Node's event loop can't interleave two calls — the risk here is strictly cross-instance, not same-process.

---

## 5. Frontend/Mobile Performance

### Web

**Data-fetching patterns are inconsistent across the app** — three different strategies coexist with no clear rationale tied to data type:
- Admin pages and 2 public components (`BreakthroughsPage.tsx`, `BreakthroughSpotlight.tsx`) use `useSWR`.
- The public Elite investor dashboard (`src/components/program/EliteDashboardPage.tsx:100‑113`) uses raw `fetch` inside `useEffect`/`useState` — no caching, no dedup across remounts, no automatic revalidation/retry. **Medium** — every navigation back re-fetches from scratch even if data is seconds old.
  - **Fix:** move to `useSWR`/react-query with a sensible `staleTime` (portfolio/capital data — 15‑30s is reasonable, not instant, not stale-for-minutes).
- The subscriber-facing Signals table (`src/hooks/useSignals.ts:1‑42`) hand-rolls its own polling hook (`fetch` + `setInterval(fetchSignals, 60000)`) instead of using SWR, an existing project dependency. Not broken, but duplicated infrastructure — and the in-code comment says "every 30 seconds" while the actual interval is 60000ms (stale comment, functionally harmless but confusing). **Low.**

**No code-splitting anywhere in the web app** — `grep -r "next/dynamic" pharma-stock/src` returns zero matches. Concretely, `src/components/app/IndustryInsights.tsx` (359 lines; imports Recharts's `LineChart`/`Line`/`XAxis`/`YAxis`/`CartesianGrid`/`Tooltip`/`ResponsiveContainer` plus `framer-motion`) is statically imported on the **public homepage** (`src/app/en/page.tsx:6,27` and the `ar` equivalent) — the highest-traffic route in the app. Shipping a full charting library in a marketing landing page's initial bundle, for a below-the-fold section, is a direct hit to homepage load/LCP for every visitor. **High.**
- **Fix:** `const IndustryInsights = dynamic(() => import(...), { ssr: false, loading: () => <Skeleton /> })`, or lazy-render below an intersection observer — the component already uses `useInView` from framer-motion internally, so the pattern exists to build on.

**Admin chat/broadcast page polls instead of using the existing Socket.IO infra.** `src/app/admin/messages/page.tsx` runs up to three concurrent `useSWR` polling loops while a conversation is open: `groups` @ 5000ms, `conversations` @ 3000ms, and the selected conversation's messages @ 3000ms — each replacing the full array and re-rendering the whole list every 3s regardless of change, on an 884-line page, despite a live Socket.IO server built for exactly this (and despite the mobile app's `useSocketMessages` already doing the "socket pushes, no polling" version correctly — see Mobile section below). **Medium** — functional but wasteful network/render churn on the admin's busiest page. (Ties back to §4.2's dead `'admin'` room join — this page currently has no working socket path to fall back on even if it wanted one.)
- **Fix:** subscribe the admin page to the same socket events the mobile app uses and use SWR's `mutate()` for pushed updates instead of interval polling. Message/conversation lists here are also unvirtualized (`.map()`, no windowing) — low risk today given admin-only usage and bounded thread length, worth a `react-window` pass if history grows.

**What's fine / no action needed:**
- `SignalsTable.tsx:133` keys rows by `signal.symbol`, safe given the DB's unique-open-signal-per-symbol constraint.
- No expensive recompute found in `IndustryInsights.tsx` — chart data is static, not derived on every render.
- `lucide-react` icons imported as named imports everywhere sampled (tree-shakeable).
- `BreakthroughsPage.tsx`/`BreakthroughSpotlight.tsx` correctly set `revalidateOnFocus: false` for essentially-static content.

### Mobile

Noticeably better shape than the web app's data layer — called out explicitly rather than manufacturing findings to fill the section.

**List virtualization is correctly implemented everywhere it matters:**
- `signals/index.tsx`, `chat/[conversationId].tsx` use **FlashList** (Shopify's `FlatList` successor), both with proper `keyExtractor`.
- `news/index.tsx`, `breakthroughs/index.tsx` key by `String(item.id)`.
- `chat/index.tsx` (conversation inbox) uses plain `FlatList` — fine, since `chat_conversations.user_id` is unique per schema, so a mobile user has at most one conversation; this list is never more than 1 item.
- Detail screens (`signals/[id].tsx`, `news/[id].tsx`, `daily-updates/[id].tsx`, `breakthroughs/[id].tsx`) correctly use `ScrollView` — one item, not a list.
- No screen anywhere maps over an unbounded array inside a bare `ScrollView`.

**Minor tuning opportunity (Low):** none of the FlashList/FlatList usages set `windowSize`/`initialNumToRender`/`removeClippedSubviews`. Not a problem at current likely data volumes (FlashList has good defaults) — revisit if signal/news lists grow into the hundreds+ per page.

**react-query configuration is deliberately tuned per data type, with rationale left in comments** — a positive pattern to preserve:
- Static-ish content (`useContent.ts`): news/daily-updates/breakthroughs use `staleTime: 120_000` (2 min) — appropriate for content that doesn't change second-to-second.
- Signals (`useSignals.ts:11‑17`): `staleTime`/`refetchInterval` both `60_000`, explicitly commented as matching the server's own 2-minute price-refresh floor; `refetchIntervalInBackground: false` stops polling when backgrounded.
- Chat messages (`useChat.ts:39‑44`): `refetchInterval: 4_000`, commented as an intentional Socket.IO fallback, paired with `useSocketMessages` (81‑136) doing the real live-push path via `qc.setQueryData` with a dedup-by-`id` guard against the socket-vs-HTTP race — a materially better pattern than the web admin chat page's polling-only approach.
- Notifications (`useNotifications.ts`): `staleTime: 30_000` for the list, unread-count polls every `60_000` — reasonable.

**Nitpick (Low):** `mobile/app/(tabs)/signals/index.tsx:73‑76` recomputes `allItems` via `.flatMap()` over query pages on every render without `useMemo`, unlike `chat/[conversationId].tsx:55‑64` which memoizes the equivalent flatten with `React.useMemo`. Cheap array op, FlashList handles reference changes fine — worth aligning for consistency: `const allItems = useMemo(() => ..., [openQuery.data, historyQuery.data, activeTab])`.

No anti-patterns found in query key construction (all stable, array-based) and no inline object/function identity issues that would defeat query caching.

---

## 6. Background/Long-Running Work

**6.1 — Bulk content import endpoints: sequential per-row inserts inside one long-held transaction.** `src/app/api/admin/news/bulk/route.ts:37‑49`, `src/app/api/admin/breakthroughs/bulk/route.ts:42‑57`, `src/app/api/admin/daily-updates/bulk/route.ts:37‑50` each loop over the submitted array with a sequential `await client.query(...)` per item, wrapped in one `BEGIN`/`COMMIT` and holding a single pool connection for the whole loop. For the realistic admin workflow (tens of items) this completes in well under a second — not a practical problem today. Risk only appears if an admin pastes an unusually large batch (hundreds+ rows): the request stays open the whole time, tying up one pool connection longer than necessary, and could compound with concurrent traffic to pressure the pool.
- Severity: **Low/Medium** (admin-only, self-inflicted, I/O-bound — doesn't block the event loop, just holds a connection).
- **Fix if large imports become a real use case:** collapse to one multi-row `INSERT ... SELECT unnest(...)` (the codebase already does exactly this correctly elsewhere — see `broadcasts/[id]/send/route.ts:97‑103`), or move very large imports to a background job.

**6.2 — Broadcast send is the one place actually built to scale, but it's still synchronous inside the HTTP request.** `src/app/api/admin/mobile/broadcasts/[id]/send/route.ts:63‑93`: `resolveAudienceUserIds` (`src/lib/services/audience.service.ts:5‑38`) pulls the full target user-ID list into memory (cheap even at tens of thousands), then processes in concurrent batches of 25, each doing a DB conversation lookup/create, a message insert, a socket emit, and an Expo push call. This is well-designed relative to a naive per-user sequential loop, but the response doesn't return until every batch completes. At a plausible scale (e.g. 2,000 recipients ÷ 25/batch = 80 batches, ~300‑800ms/batch of DB + Expo network latency), total runtime is roughly **25‑65 seconds** — long enough to hit a typical reverse-proxy idle-timeout default (e.g. 60s), though no explicit proxy timeout config was found in-repo to confirm or rule that out.
- Severity: **Medium today, High if the subscriber base or "all_users"/"elite_users" broadcast usage grows.**
- Importantly, this is **not** a data-corruption risk: if the client connection drops from a proxy timeout, the server-side loop keeps running to completion and still correctly writes `broadcast_recipients` and updates `broadcast_campaigns.status` — the only symptom is a misleading client-side error/timeout for an admin whose broadcast actually went out fine.
- **Fix:** move fan-out to a background job/queue (BullMQ, pg-boss, etc.) — have `send/route.ts` enqueue and return `202 Accepted` immediately, with a worker processing batches and updating campaign status so success no longer depends on the admin's HTTP connection staying open for the full duration.

**6.3 — Positive control, no finding.** `src/lib/services/push.service.ts:21‑96` (`sendPushToAllUsers`/`sendBilingualPushToAllUsers`) already paginates `user_push_tokens` in batches of 500 and uses Expo's own `chunkPushNotifications` rather than looping one-by-one — the right pattern, and what 6.2's per-user fan-out loop should eventually be refactored toward at the DB/push layer even after queueing is added at the HTTP layer.

---

## Prioritized Action List

### Critical — fix before anything else touches these paths
1. **Lock down or fix `PATCH /api/elite/portfolio`** — remove investor self-service absolute capital overwrite, or replace with an authorized atomic delta. (§1A.1, Finding 1)
2. **Resolve the disabled Stripe subscription webhook / subscription routes** (`_route.ts` files) — confirm with the team whether this is intentional, and if not, restore them as `route.ts` with idempotency keyed on Stripe event ID before re-enabling. (§1A.2, §2.3)
3. **Fix the released-client reuse in `admin/signals GET`** — stop calling `.query()` on a client after `.release()`; use `pool.query()` for the per-signal update loop and refactor the recursive `DELETE` call into a shared function. (§2.1)
4. **Add stampede protection to `/api/home-page-prices`** — single in-flight-promise guard, `Promise.all` instead of sequential loop, dedupe `STOCK_SYMBOLS`. (§3)

### High — fix soon, clear user-facing or data-integrity impact under normal load
5. Wrap all 16 leaky `pool.connect()` routes in `try/finally` (or convert to `pool.query()`); prioritize the public `news`/`daily-updates` routes and the admin CRUD routes. (§2.3)
6. Add `LIMIT`/`OFFSET` pagination to `admin/breakthroughs`, `admin/daily-updates`, and `admin/users` (also fix the `users` route's missing `OFFSET`/page param). (§2.4)
7. Wire `QuotesService.getQuotes` into its own `price_cache` read path (or remove the dead cache) so `/api/market/quotes` actually benefits from caching. (§3)
8. Fix the mobile refresh-token queue to reject (not silently drop) queued requests when a refresh fails. (§1B.1)
9. Code-split `IndustryInsights` (Recharts + framer-motion) out of the homepage's initial bundle via `next/dynamic`. (§5, Web)
10. Fix the duplicate-PENDING-close-request race with a transaction + row lock or a partial unique index. (§1A.1, Finding 2)
11. Before any horizontal scaling: add a Socket.IO adapter (Redis/Postgres) and move rate-limit state off in-process `Map`s. (§4)

### Medium — schedule, not urgent
12. Fix the partner-payout-request over-commitment race before building the (currently missing) payout review/approval endpoint. (§1A.1, Finding 3)
13. Close the residual-session gap after account deletion (indexed anonymized-state check, shorter TTL, or a denylist). (§1B.3)
14. Move the admin chat/broadcast page off SWR polling onto the existing Socket.IO infrastructure (and fix the dead `'admin'` room join it would depend on). (§4.2, §5 Web)
15. Move the Elite investor dashboard off raw `fetch` onto `useSWR`/react-query with a sensible `staleTime`. (§5, Web)
16. Add a per-symbol in-flight guard to `SimplePriceCacheService.getQuotes`; make the signal-price-refresh "claim" write atomic. (§3)
17. Enforce/document max-age on `mobile/v1/market/[symbol]` instead of returning a raw, potentially-stale `price_cache_simple` row. (§3)
18. Move broadcast send fan-out to a background queue instead of synchronous in-request batching. (§6.2)

### Low — polish, do opportunistically
19. Add an index on `resettokens.token`.
20. Fix the stale "every 30 seconds" comment in `useSignals.ts` (actual interval is 60s).
21. Memoize `allItems` in mobile `signals/index.tsx` for consistency with `chat/[conversationId].tsx`.
22. Fix the account-deletion double-submit duplicate `deleted_accounts` row (idempotency check).
23. Wrap `getInvestorDashboard`'s three sequential follow-up queries in `Promise.all`.
24. Consider `pg_trgm` indexing for `news.symbol` only if/when search volume justifies it.
