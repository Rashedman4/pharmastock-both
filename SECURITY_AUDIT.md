# PHARMAsTOCK Security Audit

**Scope:** `./pharma-stock` (Next.js web app + `/api/mobile/v1/**` backend) and `./mobile` (Expo app).
**Method:** Full manual review of auth/session handling, authorization/IDOR, injection/input validation, payments/webhooks, secrets/config, realtime/rate-limiting, data exposure, and dependency vulnerabilities. Read-only — no code was changed as part of this audit.
**Not in scope / not verified:** infrastructure-level controls (WAF, hosting platform body-size limits, network segmentation), the actual Stripe Dashboard webhook endpoint configuration (only the code side was inspected), and page-component-level auth for Partner/Elite dashboards (flagged as a follow-up, see High #2).

---

## Critical

### C1. Subscription payment system is dead code — no live webhook for regular (non-Elite) subscriptions, and the frontend calls non-existent endpoints
- `pharma-stock/src/app/api/payments/webhook/_route.ts`, `payments/payment/_route.ts`, `subscriptions/_route.ts`, `subscriptions/cancel/_route.ts`, `subscriptions/history/_route.ts`, `subscriptions/status/_route.ts` — all six are **underscore-prefixed**, which Next.js App Router does not register as live routes (it requires the exact filename `route.ts`). There are no live `route.ts` siblings in any of these directories.
- `pharma-stock/src/components/app/PricingSection.tsx:184,197,219,281` actively calls `/api/subscriptions/status`, `/api/subscriptions/history`, `/api/subscriptions/cancel`, and `/api/payments/payment` — all currently 404 in production. Users cannot view subscription status/history, cancel, or complete a regular subscription payment through this UI.
- The only live webhook, `pharma-stock/src/app/api/stripe/program-webhook/route.ts`, is scoped to `metadata.program_type === "ELITE_FIRM_PROFIT"` only (lines 25-38) — it does not handle `invoice.paid`, `customer.subscription.updated/deleted`, or `invoice.payment_failed`. Those cases exist only in the dead `payments/webhook/_route.ts` (lines 31, 187, 228, 241). **Regular subscription lifecycle events from Stripe are not being synced to the database at all right now.**
- `STRIPE_WEBHOOK_SECRET` is referenced only inside the dead file — if Stripe's dashboard still points at that endpoint, deliveries are failing/404ing silently, with no visible error surface.
- Git history was squashed on import (`git log --follow` shows only a single "first commit"), so intent can't be confirmed from history — but the live frontend calls confirm this is broken today regardless of intent.
- **Fix:** Decide deliberately: either (a) rename the six `_route.ts` files back to `route.ts` after confirming their logic is current and re-point Stripe's webhook config at it, or (b) if this was an intentional migration, update `PricingSection.tsx` to call whatever the new endpoints are and delete the dead files. Either way, get a live webhook handling `invoice.*`/`customer.subscription.*` events before relying on Stripe-driven subscription state.

### C2. Server-side subscription paywall enforcement is fully commented out
- `pharma-stock/src/middleware.ts:185-241` — the entire `isSubscribedRoute` gate (which calls `/api/subscriptions/status` and redirects non-subscribers to pricing) is wrapped in a block comment. **Any authenticated non-admin user currently reaches subscription-gated routes with no server-side check at all.**
- This can't simply be uncommented as-is — it targets the dead endpoint from C1. Fix C1 first.
- **Fix:** After restoring the subscription-status endpoint, re-enable this gate, and make a conscious (not silent) decision about the existing fail-open catch block (lines 236-240, which currently allows access through on any fetch error).

### C3. Unthrottled, non-expiring email-verification code enables account takeover at signup
- `pharma-stock/src/app/api/mobile/v1/auth/verify/route.ts:20-46` and legacy `pharma-stock/src/app/api/auth/verify/route.ts:4-26`. Code is generated at `mobile/v1/auth/register/route.ts:76` and legacy `auth/register/route.ts:34` as `uuidv4().slice(0,6).toUpperCase()` (~16.7M possibilities).
- **No rate limiter** on either `/verify` endpoint.
- **No expiry check** in the `/verify` query itself (`SELECT * FROM pendingusers WHERE email=$1 AND verification_code=$2`, no `created_at` filter). The 15-minute intent only happens as an incidental side effect of the next unrelated `/register` call's cleanup DELETE — a code can stay valid indefinitely if nobody else registers.
- **Exploit:** an attacker who knows a victim's email (easy to obtain) brute-forces the 6-char code against the unthrottled endpoint. On success, mobile `/verify` immediately returns a live `access_token`/`refresh_token` for the new account — the attacker is logged in as the victim before the victim ever completes signup.
- **Fix:** add a per-IP and per-email rate limiter (5–10 attempts/15 min) to both `/verify` routes, enforce `created_at > NOW() - INTERVAL '15 minutes'` in the `SELECT`, and consider longer/higher-entropy codes.

### C4. `next-auth@4.24.13` is vulnerable to a real, applicable CVE (not a false positive)
- Confirmed installed version via `node_modules/next-auth/package.json` / `package-lock.json`: exactly `4.24.13`.
- **GHSA-7rqj-j65f-68wh** (Critical — email-normalizer Unicode-homoglyph `@` bypass) applies to `>=4.10.3 <4.24.15` — 4.24.13 is inside this range. Also affected: **GHSA-xmf8-cvqr-rfgj** (High, malformed-Bearer-header uncaught exception, `>=4.0.6 <=4.24.14`) and **GHSA-x445-f3h2-j279** (Moderate, OAuth state/nonce/PKCE cookies not bound to originating provider, `<=4.24.14`).
- Impact is elevated here specifically because `pharma-stock/src/lib/nextAuth.ts` does Google/Apple JIT account-linking **by email** — a homoglyph normalization bypass is exactly the class of bug that enables account-confusion/takeover in that flow.
- **Fix:** bump `next-auth` from `^4.24.13` to `4.24.15` (confirmed same-major patch release exists via `npm view next-auth versions` — no v5 migration needed). Low-effort, high-value fix.

---

## High

### H1. Two `middleware.ts` files — the live one is missing fixes that only exist in the dead copy
- `pharma-stock/middleware.ts` (project root) is the file Next.js actually loads (confirmed via Next's build internals: because `pharma-stock/pages/api/auth/[...nextauth].ts` exists, `pagesDir` resolves to the project root, so Next scans the root for `middleware.ts`). `pharma-stock/src/middleware.ts` is dead code that's been updated without effect.
- Consequences of the live file lacking what's in the dead one:
  - No `/handoff` route exemption → a real request to `/handoff?token=...` falls into the language-redirect block, which 302s to `/ar/handoff`/`/en/handoff` **without preserving the query string** — the mobile Elite payment-handoff token is dropped on every single attempt. (The dead file's own comment documents this exact failure mode — the fix was written but shipped to the wrong file.)
  - No `PROTECTED_ROUTES` entries for Partner dashboards (`/partners/dashboard`, `/clients`, `/earnings`, `/profile`) or Elite investor dashboards (`/elite-group/dashboard`, `/portfolio`, `/executions`, `/plan`, `/closures`) that exist in the dead file — unauthenticated users hitting these page routes directly won't be redirected to login by middleware. (Page-component-level auth wasn't independently verified — flag for follow-up even if it turns out those pages self-protect.)
  - Both files' `/api/admin/*` 401 gate is identical, so admin **API** protection is unaffected.
- **Fix:** merge the `/handoff` exemption and dashboard routes into the live `pharma-stock/middleware.ts`, then delete `pharma-stock/src/middleware.ts` so this can't silently regress again. This single fix also directly repairs the mobile Elite payment flow, which is currently broken in production as a result.

### H2. Several `admin/**` routes have no in-handler role check; three divergent authorization mechanisms coexist
- `pharma-stock/src/app/api/admin/users/route.ts:5-9` — GET checks only `if (!token)`, no role check. Returns id/email/provider_email/phonenumber for the 10 most recent users + total count.
- `pharma-stock/src/app/api/admin/subscriptions/route.ts:5-9` — same pattern; would return every active subscriber's email, package, price, and end_date.
- `pharma-stock/src/app/api/admin/breakthroughs/route.ts:109-123` — `GET()` has **no auth check whatsoever**, not even token presence.
- These aren't exploitable *today* only because middleware happens to 401 all of `/api/admin/*` first — there is zero defense-in-depth if that ever changes (see H1, which shows this middleware is already fragile/duplicated).
- Of the 48 admin route files, 22 correctly use `requireAdmin()` (`src/modules/program/route-helpers.ts:16-23`, a real re-check against the JWT's `role` claim), several others (signals, history, agents POST/DELETE, and the three bulk routes in Medium #2) use a **completely separate, hardcoded `AUTHORIZED_EMAILS` env-var allowlist** unrelated to the `users.role` column that NextAuth/middleware/`requireAdmin` all rely on, and the three routes above have nothing at all.
- **Fix:** standardize every admin route handler on `requireAdmin()` as defense-in-depth independent of middleware; retire the `AUTHORIZED_EMAILS` allowlist or fold it into the role model so there's one source of truth for "is this user an admin."

### H3. Evidence-upload endpoint has no early size gate — memory-exhaustion DoS
- `pharma-stock/src/app/api/uploads/evidence/route.ts` — `MAX_EVIDENCE_FILE_SIZE_BYTES` (5MB) is only checked via `assertAllowedEvidenceFileMetadata(file)` **after** `request.formData()` has already parsed the entire multipart body into memory. Its sibling `mobile/v1/uploads/chat/route.ts:84-87` correctly does an early `content-length` header check before parsing; this route does not.
- **Exploit:** an authenticated user (any elite investor) repeatedly POSTs a very large body → memory exhaustion / DoS on the Node process, bounded only by whatever the hosting platform enforces (not verified as part of this audit).
- **Fix:** add the same early `content-length` pre-check used in `uploads/chat/route.ts:84-87` — reject before calling `.formData()` if the header exceeds the limit — and confirm the hosting platform also enforces a hard body-size cap as defense-in-depth.

### H4. User enumeration on the legacy web password-reset flow
- `pharma-stock/src/app/api/auth/forgot-password/route.ts:15-17` returns `{message:"Email not found"}` with **400** when the email doesn't exist, vs **200** on success — directly contradicting the mobile implementation (`mobile/v1/auth/forgot-password/route.ts:19-36`), which correctly always returns the same generic response regardless. The legacy route also has no rate limiter at all (mobile has 3/hour per IP).
- **Fix:** make the legacy route return an identical generic message/status in both cases, and add the same rate limiter used in the mobile version.

### H5. No refresh-token rotation on mobile
- `pharma-stock/src/app/api/mobile/v1/auth/refresh/route.ts:32-63` validates and reuses the same refresh token indefinitely up to its 30-day expiry; it never issues a new refresh token or revokes the presented one, so there's no reuse-detection possible. A stolen refresh token (e.g. exfiltrated from a compromised device or logs) remains usable by an attacker for up to 30 days concurrently with the legitimate device, with no signal to invalidate it short of explicit logout or password reset.
- **Fix:** rotate on every refresh — issue a new refresh token, mark the old `token_hash` row `revoked_at = NOW()`, and if a *revoked* token is ever presented again, treat it as a compromise signal and revoke all tokens for that `user_id`.

### H6. Dependency vulnerabilities (high/critical, from `npm audit`)
See the Dependencies section at the end for the full breakdown; summarized here since these are directly exploitable if reachable:
- **pharma-stock**: Critical — `fast-xml-parser` (DoS/entity-expansion family), `next-auth` (see C4, addressed separately with real applicability analysis). High — `brace-expansion`, `flatted`, `js-cookie`, `js-yaml`, `lodash`, `minimatch`, `next`, `nodemailer` (fix requires bump to 9.0.3), `picomatch`, `postcss`, `sharp`, `undici`, `ws`.
- **mobile**: Critical — `shell-quote`, `tar` (confirmed transitive dev-tooling only via `expo`/`@expo/cli` and `react-devtools-core` — not shipped in the production app bundle; see Low/Informational). High — `axios`, `brace-expansion`, `fast-uri`, `form-data`, `js-yaml`, `postcss`, `undici`, `ws`.
- **Fix:** run `npm audit fix` in both apps where a non-major fix is available; plan a deliberate upgrade for `nodemailer` (major bump) and re-test after.

---

## Medium

### M1. Admin bulk-content endpoints use an env-var email allowlist instead of the role check, and skip validation entirely
- `admin/breakthroughs/bulk/route.ts:12-15`, `admin/news/bulk/route.ts:12-15`, `admin/daily-updates/bulk/route.ts:12-15` all gate on `process.env.AUTHORIZED_EMAILS.split(",").includes(token.email)` rather than `role === 'admin'` — a typo or stale entry in that env var silently breaks or over-grants access (same root cause as H2).
- No Zod schema or shape guards on the bulk payload items — e.g. `news/bulk/route.ts:39` does `item.title.en` directly from `req.json()`; a malformed item throws, is caught, and the raw JS error is string-concatenated into the JSON response (`"Error adding news. error: " + error`), leaking internal error detail to the admin caller. `news.price` also has no positivity/finite check before insert (no DB CHECK constraint on that column).
- **Fix:** switch these three routes to the standard admin-role check, add Zod schemas for the bulk body shape (including `price: z.number().positive()`), and return a generic error message instead of interpolating the caught error.

### M2. Account deletion leaves the user's own free-text content readable after "deletion"
- `pharma-stock/src/app/api/mobile/v1/me/route.ts:180-241` correctly anonymizes `users.*` and deletes `mobile_refresh_tokens`/`user_push_tokens`/`user_whatsapp`, but never touches `chat_conversations`/`chat_messages` (`content` text the user typed, tied by FK) or `elite_applications` (`description`, `phone_number`).
- Since this feature exists specifically to satisfy Apple's account-deletion requirement, leaving a user's own support-chat text and application description fully readable by admins under an anonymized account is a real retention gap, not just theoretical.
- **Fix:** within the same transaction, redact `chat_messages.content`/`attachment_url` for the user's conversations and `elite_applications.description`/`phone_number` — or explicitly document why they're retained (e.g. legal hold) if that's intentional.

### M3. Legacy password reset doesn't revoke mobile sessions
- `pharma-stock/src/app/api/auth/reset-password/route.ts:12-44` only updates `users.password` and deletes the used reset token — unlike the mobile route (`mobile/v1/auth/reset-password/route.ts:55-59`), it doesn't revoke `mobile_refresh_tokens`. A user who resets their password via the web because they suspect compromise leaves any stolen mobile refresh token still working.
- **Fix:** add the same `UPDATE mobile_refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL` to the legacy route.

### M4. `.gitignore` protects the Firebase Admin SDK key by exact filename, not pattern
- Root `.gitignore` has exactly one line: `mobile/pharmastock-d0cb4-firebase-adminsdk-fbsvc-b875dfb8a1.json`. `mobile/.gitignore` has no rule for `*firebase-adminsdk*` or similar. If this key is ever rotated in the Firebase console, the new download gets a different random suffix and would **not** be caught — it becomes `git add`-able and committable by accident.
- **Fix:** add a real pattern (`*firebase-adminsdk*.json`, `serviceAccountKey*.json`) to `mobile/.gitignore` so this doesn't depend on one specific filename. (Confirmed via `git log`: this file itself has never been committed — only the pattern gap is the concern, going forward.)

### M5. `mobile/v1/auth/reset-password` has no rate limiter
- Confirmed by direct read — no `rate-limit.ts` import. Exploitability is low (reset tokens are `uuidv4()`, ~122 bits, infeasible to brute-force regardless of rate), but worth closing for defense-in-depth/DoS-resistance consistency with sibling auth routes.
- **Fix:** add the same per-IP limiter used on `forgot-password`.

---

## Low / Informational

- **NextAuth cookie config is implicit** — no explicit `cookies:` block in `nextAuth.ts`; relies on NextAuth v4 defaults (which do set `httpOnly`, `sameSite:lax`, and `secure` based on HTTPS detection). Not currently a vulnerability, but recommend making it explicit so correct behavior doesn't silently depend on `NEXTAUTH_URL` being set to `https://` in production.
- **Legacy `/api/auth/verify/route.ts:7`** logs the raw `{email, code}` request body to server logs pre-validation via `console.log`. Avoid logging verification codes/PII.
- **Typing-indicator spoofing across conversations** — `pharma-stock/src/lib/socket/socket-server.ts:85-91`: `typing_start`/`typing_stop` broadcast to `conv:${conversationId}` with no `chatService.userOwnsConversation` check (unlike `join_conversation`/`send_message`, which do check). Any authenticated socket can inject a spoofed typing event into a conversation it was never part of. Impact is limited to a fake presence indicator — no data read/write — but it's a real broken-access-control instance. Fix: apply the same ownership check used in `join_conversation`.
- **CORS on `/api/mobile/v1/**`** — confirmed genuinely absent, but investigated and ruled out as a real issue: auth is Bearer-token, not cookie/session-based, so there's no ambient-credential CSRF surface, and a real cross-origin browser caller would fail preflight on the custom `Authorization` header anyway (no `OPTIONS` handler exists). No fix needed.
- **`mobile/v1/auth/refresh` has no rate limiter** — investigated; refresh tokens are 64-byte random values, brute-force is infeasible at any reachable rate. Not currently exploitable, low-value hardening only.
- **Dead code**: `admin/elite-portfolios/[memberId]/assign-execution/route.ts` is a stub returning HTTP 410 with a static deprecation message — no auth check, but also no data/logic, so no exploitable impact. Recommend deleting rather than leaving an admin-namespaced no-op around.
- **`createManualEliteMemberFromUser`** (`program.service.ts:3924`) bypasses the $50k minimum, but is only reachable via `POST /api/admin/manual-elite-members`, which correctly calls `requireAdmin()` — confirmed intentional admin override, not a privilege-escalation path.
- **`submitEliteApplication`** enforces a $100,000 minimum in application code (`program.service.ts:194`), stricter than the DB's $50,000 CHECK constraint — an inconsistency in messaging only, not a security gap.
- **Mobile's critical `npm audit` hits (`shell-quote`, `tar`) are transitive dev-tooling dependencies** — traced via `npm ls` to `expo → @expo/cli` (tar, build tooling) and `react-native → react-devtools-core` (shell-quote, dev-only). Neither ships in the production app bundle; real exploitability is limited to a compromised build/CI environment, not a deployed app instance. Still worth clearing via dependency bumps for CI hygiene, but shouldn't be weighted the same as a runtime-reachable critical.
- **FMP market-data API key** (`pharma-stock/src/modules/market-data/financial-modeling-prep.provider.ts:25`) is correctly read from `process.env.MY_API_KEY` (not hardcoded) — the env var name itself is generic/unclear naming, cosmetic only.
- **Secrets grep came back clean** overall — no hardcoded Stripe keys, no hardcoded `MOBILE_JWT_SECRET` (fails closed if unset, no insecure default), no embedded-credential Postgres connection strings in source.
- **`MOBILE_JWT_SECRET` handling verified solid** — no fallback/default secret if the env var is unset (both generate and verify fail closed); no algorithm-confusion risk since the implementation always uses HMAC-SHA256 against the server secret regardless of any header content (there's no `jsonwebtoken`-style `alg` branching to exploit).
- **bcrypt cost factor** consistently `12` across all 7 password-hashing call sites. Fine.
- **Mobile-handoff provider** (`nextAuth.ts:103-153`) verified solid: token consumption is a single atomic `UPDATE ... WHERE consumed_at IS NULL AND expires_at > NOW() RETURNING ...` (no race), `redirect_path` is fully server-derived at mint time (never client-supplied, no open-redirect risk), and the mint endpoint's rate limiter is keyed by authenticated `userId` (10/5min), not just IP.
- **Firm-profit-payment webhook idempotency verified correct** — `program.service.ts:3749-3775` uses `SELECT ... FOR UPDATE` row-locking and short-circuits on an already-`PAID` status before applying any effects. No double-credit risk from Stripe redelivery on this specific path.
- **No separate admin socket-auth path exists**, and no socket ever joins an `'admin'` room — `socket-server.ts:67`'s `io.to('admin').emit(...)` currently reaches nobody. This reads as a functional bug (admin dashboard likely isn't getting live push for new messages), not a security issue.
- **SQL injection**: consistently parameterized throughout. An independent re-check of every `${var}`-in-SQL-string site found across the codebase (9 originally flagged plus 2 more from a broader sweep) confirmed all are safe patterns — allow-listed column names, numeric placeholder-index building (`$${i}`), or fixed WHERE/LIMIT fragments with actual values still bound via the params array. No untrusted request data was found spliced directly into SQL text anywhere.
- **Upload validation** (`evidence-security.ts`, both upload routes) is otherwise solid: MIME is verified against sniffed magic bytes (not just client-claimed extension/Content-Type), filenames are never used to build storage paths (public IDs are `crypto.randomUUID()` or regex-sanitized), and uploads proxy directly to Cloudinary with no local disk write — no path-traversal vector.
- **Money-adjacent endpoints checked out clean**: trade-execution submission validates quantity/price and independently re-verifies the trade plan belongs to the caller's own portfolio and is in the correct state before allowing an execution; manual firm-profit-payment review validates its decision against an allow-list plus payment-state guards.
- **IDOR spot-checks all came back correctly scoped**: trade-plan responses, close-request responses, firm-profit-payment proof uploads, partner client-detail lookups, and notification read-status all derive the owning user/portfolio server-side from the authenticated session/JWT rather than trusting a client-supplied id.
- **Data over-fetch sampling**: `mobile/v1/me` GET, `admin/mobile/users`, `admin/partners` response shapes contain no password hashes and no other-users'-PII leakage.

---

## Dependency Vulnerabilities (`npm audit`)

**pharma-stock** (`npm audit --json`): 36 total — 2 critical, 13 high, 21 moderate, 0 low.
| Severity | Package | Notes |
|---|---|---|
| Critical | `fast-xml-parser` | DoS/entity-expansion family; fix available (non-major) |
| Critical | `next-auth` | See C4 — confirmed applicable to installed 4.24.13, patch to 4.24.15 |
| High | `brace-expansion`, `flatted`, `js-cookie`, `js-yaml`, `lodash`, `minimatch`, `next`, `picomatch`, `postcss`, `sharp`, `undici`, `ws` | Fixes available, non-major |
| High | `nodemailer` | Fix requires major bump to 9.0.3 — plan/test before upgrading |

**mobile** (`npm audit --json`): 29 total — 2 critical, 8 high, 18 moderate, 1 low.
| Severity | Package | Notes |
|---|---|---|
| Critical | `shell-quote`, `tar` | Transitive dev-tooling only (expo CLI / react-devtools) — not in shipped app bundle, see Low/Informational |
| High | `axios`, `brace-expansion`, `fast-uri`, `form-data`, `js-yaml`, `postcss`, `undici`, `ws` | Fixes available, non-major |

---

## Prioritized Action List

1. **Decide and fix the subscription payment system** (C1) — either restore the six disabled routes + live webhook, or migrate the frontend to whatever replaces them. This is both a security and a revenue-integrity issue.
2. **Re-enable server-side subscription paywall enforcement** (C2) once #1 is fixed.
3. **Stop the signup-verification brute-force path** (C3) — rate limit + enforce expiry on both `/verify` routes.
4. **Bump `next-auth` to 4.24.15** (C4) — trivial patch, closes a real CVE relevant to this app's email-based account linking.
5. **Fix the middleware split** (H1) — merge the `/handoff` exemption and dashboard protections into the live root `middleware.ts`, delete the dead `src/middleware.ts`. This also directly repairs the currently-broken mobile Elite payment handoff.
6. **Add in-handler `requireAdmin()` checks** to `admin/users`, `admin/subscriptions`, `admin/breakthroughs` GET, and standardize the three bulk routes off the `AUTHORIZED_EMAILS` allowlist (H2, M1).
7. **Fix the evidence-upload DoS gap** (H3) — early content-length check.
8. **Fix legacy-web user enumeration + missing rate limit on forgot-password** (H4).
9. **Implement refresh-token rotation and reuse detection** (H5).
10. **Run dependency bumps** (H6) — `npm audit fix` in both apps for non-major fixes; schedule the `nodemailer` major-version upgrade separately.
11. **Close the remaining Medium items**: account-deletion completeness (M2), legacy reset-password session revocation (M3), `.gitignore` pattern hardening (M4), reset-password rate limiter (M5).
12. **Sweep the Low/Informational list** as routine hardening (explicit cookie config, remove verification-code logging, fix typing-indicator ownership check, delete dead stub routes) — none are urgent, but cheap to close.

---

## Remediation status (as of 2026-07-26)

**Fixed:**
- **C4** (`next-auth` critical CVE) — bumped `4.24.13` → `4.24.15` (already inside the existing `^4.24.13` package.json range, so this was a lockfile update, not a version-range change). Verified via `npm audit` that the specific applicable critical GHSA is gone (severity dropped from Critical to Moderate; the remaining Moderate entry resolves to a nonsensical downgrade suggestion from npm's advisory aggregation and does not apply to this codebase — see H6/dependencies note below). Verified with a full `tsc --noEmit` and `npm run build` — both clean.
- **H1** (dead `src/middleware.ts` vs. live root `middleware.ts`) — merged the missing `/handoff` query-string exemption and the Partner/Elite dashboard route protections into the live `pharma-stock/middleware.ts`, additively (nothing removed from the existing file). This directly repairs the mobile Elite payment-handoff flow, which was silently broken in production. **`pharma-stock/src/middleware.ts` (the dead file) was intentionally left in place, not deleted** — it's unused/inert either way, but removal wasn't requested; flag if you'd like it deleted or archived to stop future edits from landing in the wrong file again.
- **H2 / M1** (admin routes with no in-handler role check + bulk routes on the `AUTHORIZED_EMAILS` allowlist) — `admin/users`, `admin/subscriptions`, `admin/breakthroughs` (GET **and** the POST/DELETE that were still on `AUTHORIZED_EMAILS`, fixed for consistency since the file was already being touched), `admin/breakthroughs/bulk`, `admin/news/bulk`, `admin/daily-updates/bulk` all now use the same `requireAdmin()` helper every other correctly-guarded admin route already uses. Caught and fixed one bug this surfaced: `admin/daily-updates/bulk/route.ts` referenced the now-removed `token` variable for `created_by` — replaced with `auth.userId`. Full project typecheck + production build both clean after this change.
- **H6 / dependencies** — ran `npm audit fix` (no `--force`) in both apps after a dry-run review confirmed every change was a same-major-version patch/minor bump (no breaking changes possible without `--force`).
  - **pharma-stock**: 36 → 19 vulnerabilities (critical 2→0, high 13→18 *reported* but see note, moderate 21→1). Verified with `tsc --noEmit` and `npm run build` — both clean. Remaining items (`next`, `sharp`, `postcss` chain; `nodemailer`) need a deliberate major-version upgrade, not attempted here.
  - **mobile**: critical dropped 2→0 (`shell-quote`, `tar` fixed). Total *reported* count went 29→42 — investigated this: `package.json` has zero diff (confirmed via `git diff`), only `package-lock.json` was relocked, and the installed `expo` version is unchanged at `54.0.36`. The apparent increase is `npm audit` surfacing pre-existing SDK-54-line advisories that all require a major jump to Expo SDK 57 to resolve (every remaining entry's `fixAvailable` points at a major version) — nothing new was introduced, no major/breaking change was applied. Verified with `tsc --noEmit` — clean.

**Also fixed (approved after explanation, 2026-07-26):**
- **C3** (verification-code brute force) — added a 10-attempts/15-min per-IP rate limiter to both `/verify` routes (mobile and legacy web) and made the `pendingusers` lookup itself reject codes older than 15 minutes (`created_at > NOW() - INTERVAL '15 minutes'`), instead of relying on an unrelated cleanup step. Also removed a stray `console.log` of the raw `{email, code}` body in the legacy route while touching that file.
- **H3** (evidence-upload DoS) — added the same early `content-length` pre-check the sibling chat-upload route already used, rejecting oversized uploads before the body is read into memory.
- **H4** (legacy forgot-password enumeration) — the legacy route now always returns the same generic response regardless of whether the email exists (matching the mobile route's already-correct behavior), and picked up the same per-IP rate limiter the mobile route uses.
- **H5** (refresh-token rotation) — `mobile/v1/auth/refresh` now issues a new refresh token and revokes the old one on every use (in a transaction, preserving the original device metadata), and detects reuse of an already-rotated token as a compromise signal (revokes every active session for that user). **This required a matching mobile-client change** — `mobile/services/api.ts` now persists the newly issued `refresh_token` from the response (previously it only stored the new access token and kept reusing the same refresh token forever, which is exactly what rotation replaces); `mobile/types/api.ts`'s `RefreshResponse` type was updated to match. Confirmed via `grep` that these are the only two mobile files that touch the refresh response shape. Full typecheck (both apps) + production build (web) all clean after this change.

**Explicitly deferred (per your instructions — not done):**
- **C1 / C2** (dead subscription payment routes + commented-out paywall middleware) — "later, don't need it now."
- **M2–M5** and the full **Low/Informational** sweep — explicitly told not to do these now.

**New review performed at your request (not in the original audit):** the new Socket.IO admin-auth code added as part of your separate performance-audit remediation (`getAdminSocketAuth`/`extractNextAuthSessionCookie` in `socket-server.ts`, `adminChatSocket.ts`, and the `server.ts` CORS config) was reviewed. No vulnerability found — it correctly verifies the NextAuth JWT signature server-side with the real secret, checks `role === 'admin'`, doesn't bypass the existing mobile-JWT auth path, and CORS is scoped to an explicit origin allowlist. One low-severity resilience note (not a vulnerability): the cookie parser assumes the session JWT never gets large enough to be split across chunked `next-auth.session-token.0/.1` cookies — true today, worth remembering if more claims are ever added to the session token.
