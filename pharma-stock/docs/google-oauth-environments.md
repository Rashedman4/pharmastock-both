# Google OAuth & Firebase — dev/production environment options

Status: **undecided — reference document, no option chosen yet.** Written 2026-08-01. Re-read this before changing anything, and update the "Decision" section at the bottom once you pick one.

## 1. Current state (as audited from the repos + Google Cloud Console screenshots)

omplexity: moderate, one-time — not simple, not exotic. It's roughly 10-12 discrete steps across three phases, each depending on the one before it, so it has to be done in order rather than in parallel.
Realistic breakdown:

Console (you, in Google Cloud + Firebase — can't be scripted):

1. Firebase Console → Add Firebase to project 328204317034.
2. Get the Android SHA-1 from the EAS-managed release keystore (not local debug) — eas credentials → Android → production profile → view the keystore → copy the SHA-1 shown there.
3. Register Android app (com.biopharmastock.app) in that Firebase project with that SHA-1 → download prod google-services.json.
4. Register iOS app (com.biopharmastock.app) → download prod GoogleService-Info.plist.
5. Firebase Console → Project Settings → Cloud Messaging → generate the FCM V1 service account key.
6. Confirm 328204317034's OAuth consent screen is In production, not Testing — this now gates production mobile sign-in too, not just web, since under Option 1 the production project serves both.

Terminal/EAS (I run, you approve mutating ones): 7. Upload the two new files as EAS file-type environment variables, scoped to the production profile. 8. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID per profile (dev project's values for development/local/preview, 328204317034's for production). 9. Upload the FCM service account key to EAS credentials (eas credentials → Android → Push Notifications), never to the repo.

File edits (I write, you review the diff): 10. app.json → app.config.js (needed because a static JSON file can't branch googleServicesFile by env var — this is the one structural code change, everything else is config/console). 11. eas.json profile env blocks updated per step 8. 12. A rebuild (eas build --profile production) is required to actually test any of this — you can't verify Google Sign-In or FCM registration changes with a JS-only reload, since
google-services.json/GoogleService-Info.plist are consumed at native build time.

The genuinely fiddly parts, honestly: getting the SHA-1 from the right keystore (easy to grab the wrong one by accident), and whether Firebase auto-creates the iOS OAuth client when you register the iOS app or
whether you have to create it manually in Cloud Console credentials (the dev project has one named "BIO PHARMA APPLE" — I can't tell from here whether that was auto-generated or hand-made, so budget for a
manual-creation step if Firebase doesn't do it for you).

On the consent-screen page — you said you couldn't find anything at the top. Two likely reasons: either Google's rolled out the newer split-tab layout for that project (look for tabs like Audience, Branding,
Data Access instead of one flat page — Publishing status lives under Audience in that layout), or the consent screen was never configured for that project at all, which is its own problem. Can you tell me what
you do see at the top of that page, or drop a screenshot in the same consoles folder?
Two Google Cloud projects, on two different Google accounts:

|                          | Dev project                                                                                                 | Production project                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Console name             | "PharmaStock"                                                                                               | "Pharma-Stock"                                                  |
| Project number           | `626285874163`                                                                                              | `328204317034` **— unconfirmed, see discrepancy below**         |
| Firebase project         | `pharmastock-d0cb4` — linked                                                                                | Not linked (no API keys, no service accounts)                   |
| OAuth clients            | iOS (`BIO PHARMA APPLE`), Android (`BIO PHARMA ANDROID`), Web (`bio pharma stock`) — all created 2026-05-12 | Web only (`Bio Pharma Stock`, created 2025-03-24)               |
| Used by mobile app today | Yes — `mobile/google-services.json`, `mobile/app.json` iOS scheme, all point here                           | No                                                              |
| Used by web app today    | Unconfirmed — see below                                                                                     | Intended, per user                                              |
| Redirect                 | `http://localhost:3000/api/auth/callback/google` (per user: "it even redirects to localhost:3000")          | Should be `https://biopharmastock.com/api/auth/callback/google` |

**Open discrepancy, not yet resolved:** `pharma-stock/.env.local` line 42 has `TBIOGOOGLE_CLIENT_ID=482921556368-ki8ulu1nqi5epnl11081g1f35ghs33af...` — project number `482921556368`. The production project shown in the Google Cloud Console screenshot has project number `328204317034` and a client ID starting `328204317034-nujo...`. These are two different numbers and two different client IDs. Before finalizing any of the options below, confirm which one is actually set as `GOOGLE_CLIENT_ID` in CapRover, and treat `.env.local`'s `TBIOGOOGLE_CLIENT_ID` as possibly stale.

Relevant code, for when you come back to this:

- `pharma-stock/src/lib/nextAuth.ts:84-94` — web NextAuth Google provider, reads `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- `pharma-stock/src/app/api/mobile/v1/auth/google/route.ts:24-33,65-82` — mobile's Google ID-token verification. Calls `https://oauth2.googleapis.com/tokeninfo`, checks `aud` against `[GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID]`.
- `mobile/lib/googleSignIn.ts:9-20` — configures `@react-native-google-signin/google-signin@14.0.2` with `webClientId` (→ `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`) and `iosClientId` (→ `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`). Per this library's behavior, the ID token's `aud` is the **web** client ID on both iOS and Android.
- `mobile/eas.json` — `development`/`local`/`preview`/`production` profiles currently define `EXPO_PUBLIC_API_URL`/`EXPO_PUBLIC_SOCKET_URL`/`EXPO_PUBLIC_PROJECT_ID` but **not** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` or `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — this gap exists regardless of which option below you pick; it just gets filled differently.

## 2. Foundational fact: does using a different Google Cloud project change who a user matches to?

**No.** This applies to all three options below equally, so it's not a factor in choosing between them.

Google's ID token `sub` claim (OpenID Connect "Subject Identifier") identifies the **end user's Google Account**, scoped to the token issuer (`accounts.google.com`). It does not depend on which OAuth client, which Google Cloud project, or which Google Cloud _account_ requested the token. Two unrelated apps on two unrelated projects get the identical `sub` for the same signed-in human — that's the mechanism that makes "Sign in with Google" portable across apps at all.

Both matching queries in this codebase key off `sub`:

```sql
-- mobile: pharma-stock/src/app/api/mobile/v1/auth/google/route.ts:103-109
SELECT id, email, firstname, lastname, phonenumber, role, created_at
FROM users WHERE provider = 'google' AND provider_id = $1   -- $1 = tokenInfo.sub

-- web: pharma-stock/src/lib/nextAuth.ts:167-171
SELECT * FROM users WHERE provider = $1 AND provider_id = $2  -- $2 = account.providerAccountId (also sub)
```

So a user signing in via mobile (against whichever project mobile uses) and later via web (against production's project) lands on the same row, regardless of which of the three options you pick. **The thing that actually varies by option is availability and consent-screen behavior, not identity matching:**

- **OAuth consent screen publishing status** (Testing vs. In production) on whichever project a given build authenticates against. Testing caps sign-in to ~100 explicitly added test-user emails and shows an "unverified app" warning to everyone else. Check this per project before shipping a build that depends on it.
- **Authorized redirect URIs / origins** must exactly match the environment making the request, or the OAuth flow fails outright (this is a hard error, not a silent identity issue).

## 3. Option 1 — Same bundle ID, EAS swaps credential files per build profile

Convert `mobile/app.json` to `mobile/app.config.js` (a function, so `googleServicesFile` can read from an env var instead of a hardcoded path). Upload dev's and production's `google-services.json` / `GoogleService-Info.plist` as EAS **file-type** environment variables, scoped per build profile. Every EAS profile automatically gets the right project's credentials at build time — nothing to swap by hand.

**Console setup (production project, one-time):**

1. Firebase Console → Add project → select existing GCP project (confirm the correct number first — see §1 discrepancy).
2. Project Settings → Add app → Android, package `com.biopharmastock.app`. You'll be asked for a SHA-1 — get it from the **EAS-managed release keystore**, not a local debug keystore: `eas credentials` → Android → production → View credentials → copy the SHA-1 fingerprint shown there. Download the resulting `google-services.json`.
3. Project Settings → Add app → iOS, bundle `com.biopharmastock.app`. Download `GoogleService-Info.plist`.
4. Project Settings → Cloud Messaging → Service accounts → Firebase Admin SDK → Generate new private key. This is the FCM V1 service account key — upload it straight into EAS (`eas credentials` → Android → Push Notifications → Google Service Account), never into the repo.
5. You likely don't need a 4th ("mobile audience") web client in production: the existing "Bio Pharma Stock" web client (already used by NextAuth) can double as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` for production mobile builds too — a single Web-type OAuth client can serve both the authorization-code flow (NextAuth) and as an ID-token audience (GoogleSignin's `webClientId`) simultaneously. If you reuse it this way, `google/route.ts`'s existing `GOOGLE_CLIENT_ID` check already covers it — no extra allowlist entry needed.

**File edits:**

- `app.json` → `app.config.js`, `googleServicesFile: process.env.GOOGLE_SERVICES_JSON_PATH ?? './google-services.json'` (dev file stays the default/fallback for local builds).
- `eas.json`: add `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` to each profile's `env`, dev project's values for `development`/`local`/`preview`, production project's values for `production`.

**Ongoing maintenance:** low once set up — `eas build --profile production` always pulls the right project's files automatically.

**Trade-off:** same bundle ID means you can't have a dev build and a production build installed on the same test device at once — installing one replaces the other's app icon.

**Pick this if:** you want production mobile fully isolated (its own FCM sender, its own OAuth consent screen, its own quota) from whatever happens in dev/preview builds, and you don't need both on one phone simultaneously.

## 4. Option 2 — Separate bundle identifiers, true side-by-side app variants

Everything in Option 1, plus a distinct package name/bundle ID for non-production builds (e.g. `com.biopharmastock.app.dev`), switched via an `APP_VARIANT` env var in `app.config.js`. Both a dev-variant and the real production app can be installed on one phone at once, with distinguishable icons/names.

**Extra setup beyond Option 1:** the dev project's Android/iOS apps are _currently_ registered under the plain `com.biopharmastock.app` (no `.dev` suffix) — matching everything else in the repo today. To do this properly you'd re-register new Android/iOS apps in the dev Firebase project under the new `.dev` package name, get a new SHA-1 for that variant, download new dev-variant credential files, and update `app.config.js` to switch `android.package` / `ios.bundleIdentifier` / app name / icon based on `APP_VARIANT`.

**Ongoing maintenance:** highest of the three — two full sets of native app registrations to keep in sync going forward (new Firebase app entries, new SHA-1 if the dev keystore ever rotates, etc.).

**Pick this if:** you specifically want to test a build and use the live production app on the same phone side by side. If that's not a real day-to-day need, this is more setup than it's worth.

## 5. Option 3 — One Firebase project for all mobile builds, forever

Mobile (every EAS profile, including `production`) keeps using the dev project (`626285874163`) for Google Sign-In + FCM permanently. The production Google Cloud project (`328204317034` or whichever is confirmed correct) stays web-OAuth-only, exactly as it is today, used only by `nextAuth.ts` for the web app's login flow. No new Firebase project, no new SHA-1 registration, no new FCM key, no `app.config.js` conversion.

**Setup — this is the entire list:**

1. Console: open the dev project's **OAuth consent screen** tab, confirm Publishing status is **In production**, not Testing (§2 — this is the one thing that can actually break real users under this option).
2. `mobile/eas.json`: add to **every** profile's `env` block —
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=626285874163-3ebopf6u8mnmm7orseal422m7onobfiq.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=626285874163-2jqr9ahnn2novak1v5foirlr9ehm350i.apps.googleusercontent.com
   ```
   (Same values in `development`, `local`, `preview`, and `production` — there's only one project involved, so there's nothing to vary per profile.)
3. CapRover: set `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID` (the backend allowlist entries in `google/route.ts:72-73`) to the dev project's iOS/Android client IDs, as defense in depth — in practice `aud` will always equal the web client ID per the library's behavior (§1), so this is a belt-and-suspenders entry, not strictly required.

**Ongoing maintenance:** effectively none — this is closing an existing config gap, not standing up new infrastructure.

**Trade-off:** production mobile traffic and dev/test mobile traffic share one Firebase project — one FCM sender, one OAuth consent screen, one quota pool. A misbehaving dev build could in theory affect the same push infra real users depend on. For an app this size, that's a low-severity, well-understood trade-off — plenty of small-to-mid apps never split Firebase per environment at all, specifically because push tokens and Google Sign-In aren't backend-URL-sensitive the way `EXPO_PUBLIC_API_URL` already is.

**Pick this if:** efficiency/low-maintenance is the priority and you're comfortable with dev and production mobile builds sharing one Firebase project.

## 6. Comparison

|                                     | Option 1   | Option 2                 | Option 3 |
| ----------------------------------- | ---------- | ------------------------ | -------- |
| New Firebase project needed         | Yes (prod) | Yes (prod)               | No       |
| New SHA-1 registration              | Yes (prod) | Yes (prod + dev variant) | No       |
| New FCM key to manage               | Yes        | Yes                      | No       |
| `app.config.js` conversion          | Yes        | Yes                      | No       |
| Dev + prod installable side by side | No         | Yes                      | No       |
| Isolated prod push/consent screen   | Yes        | Yes                      | No       |
| One-time setup effort               | Moderate   | High                     | Minimal  |
| Ongoing maintenance                 | Low        | Highest                  | Lowest   |

## 7. Decision

_Not yet chosen. Fill in when decided: which option, date, who approved it, and a one-line reason._
