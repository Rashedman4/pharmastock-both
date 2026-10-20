# Releasing the mobile app

Everything needed to ship a new version of **Bio Pharma Stock** to the App Store
and Google Play.

---

## 1. The three numbers

They live in `mobile/app.json` and are edited **by hand** before every release.
`autoIncrement` is deliberately off in `eas.json`, so whatever is written in
`app.json` is exactly what ships — no surprises, nothing rewritten behind you.

| Field | Where | What it is | Rule |
|---|---|---|---|
| `expo.version` | app.json | The version users see: `1.1.0` | Must change for every new **public App Store release** |
| `expo.ios.buildNumber` | app.json | Internal iOS upload counter | Unique **within one `version`**. Reset to `"1"` when `version` changes |
| `expo.android.versionCode` | app.json | Internal Play upload counter, an integer | Must **strictly increase forever**. Never reuse a number, not even for a rejected build |

### The one thing that trips people up

`versionCode` is global to the app and only ever climbs. `buildNumber` resets
every time `version` changes. So the two numbers drift apart over time, and that
is correct — don't try to keep them in sync.

```
version 1.0.0  buildNumber 1   versionCode 1    <- what actually shipped
version 1.0.0  buildNumber 1   versionCode 3
version 1.0.1  buildNumber 1   versionCode 3    <- rejected, code was already live
version 1.0.1  buildNumber 1   versionCode 4
version 1.1.0  buildNumber 1   versionCode 5    <- where you are now
version 1.1.0  buildNumber 2   versionCode 6    <- rejected build, resubmitted
version 1.1.1  buildNumber 1   versionCode 7    <- version changed, buildNumber reset
```

### Which to bump

- **Normal new release** -> bump `version` (e.g. `1.1.0` -> `1.1.1`), set
  `buildNumber` to `"1"`, bump `versionCode` by 1.
- **Re-uploading the same release** (previous build was rejected, or you fixed
  something before going live) -> leave `version` alone, bump `buildNumber` by 1,
  bump `versionCode` by 1.
- Version numbering is your call: `1.0.x` for fixes, `1.x.0` when there's a
  noticeable new feature.

### If a `versionCode` is ever rejected as too low

Play Console -> **Release -> App bundle explorer** shows every versionCode ever
uploaded. Set `app.json` above the highest one.

This happened on the 1.0.1 release: versionCode 3 was already live, the Android
submission was rejected after the build had finished, and only Android had to be
rebuilt. Checking first is cheaper than a wasted 20-minute build.

---

## 2. Release checklist

### Step 0 — Deploy the backend FIRST, migration included

Not optional, and the failure mode is usually silent rather than loud: the old
backend answers the request, just wrongly. On 1.0.1 an older backend **ignored
the `date` param** on `GET /api/mobile/v1/daily-updates?date=YYYY-MM-DD` and
returned a rolling 24 hours, so picking "10 Jul" quietly showed today's items
under the wrong date instead of erroring.

Order, every time:

1. Run any new SQL in `pharma-stock/migrations/` against production. The
   migrations here are written to be **idempotent and re-runnable**, so running
   one twice is safe.
2. Deploy `pharma-stock`.
3. Curl the endpoints the new app version depends on before building anything.

For 1.1.0 that was `migrations/stocks_watchlist_announcements.sql` (the
`stocks`, `user_watchlist` and `company_announcements` tables) plus:

```bash
curl "https://biopharmastock.com/api/stocks/search?q=mr"   # ranked, non-empty
curl "https://biopharmastock.com/api/announcements"        # 200, even if total 0
```

The mobile app only ever calls `/api/mobile/v1/*`, so when a release adds a
feature, check the `v1` route for it answers too — a missing route is a 404 the
app shows as an empty screen.

### Step 1 — Bump the numbers

Edit `mobile/app.json` per the table above.

### Step 2 — Sanity check

```bash
cd mobile
npm run typecheck
npm run lint
```

### Step 3 — Build and upload

```bash
npx eas whoami     # confirm you are logged in; `npx eas login` if not
npx eas build --platform all --profile production --auto-submit
```

Takes roughly 15-30 minutes for both platforms. EAS prints a URL to watch.

`--auto-submit` uploads each build to its store as soon as it finishes, using
the `submit.production` profile in `eas.json`. To inspect the artifacts first,
drop the flag and run afterwards:

```bash
npx eas submit --platform android --profile production --latest
npx eas submit --platform ios     --profile production --latest
npx eas submit --platform ios     --profile production --id <build-id>  # a specific build
```

Both submits are **unattended** — Android uses
`google-play-service-account.json`, and iOS uses an App Store Connect API key
stored on EAS servers (`[Expo] EAS Submit`, key id `LN2M4GH447`), not the
`appleId` in `eas.json`. Nothing prompts for an Apple password. So
`--auto-submit` is safe to start and walk away from: Android lands as a draft,
and iOS lands in TestFlight without being submitted for review.

A finished build can be submitted at any time later with `--id`; there is never
a reason to rebuild just to submit. `npx eas build:list --platform ios` prints
the ids with their version and build number.

### Step 4 — Google Play (finish in the Console)

`eas.json` is set to `track: production`, `releaseStatus: draft`, so the upload
lands as a **draft production release**. Nothing is public until you say so.

1. Play Console -> **Release -> Production** -> the draft release -> **Edit
   release**
2. Paste the **Release notes** text, once per language (`en-US` and `ar`)
3. **Save** -> **Review release**
4. Set a **rollout percentage** if you want a staged rollout (20% for a day,
   then raise it via Production -> **Update rollout**), then **Start rollout to
   Production**

Google review for production is usually hours, occasionally a few days. The
rollout starts on its own once it is approved.

### Step 5 — App Store (finish in App Store Connect)

`eas submit` uploads the build to App Store Connect, where it appears in
**TestFlight**. It is *not* submitted for review automatically. Apple needs
5-10 minutes to process the upload, and emails you when it's done; until then
the build cannot be attached.

1. App Store Connect -> the app -> the blue **＋** next to *iOS App* -> enter
   the version (e.g. `1.1.0`) -> **Create**
2. **What's New in This Version**, once per localization — switch localization
   with the language dropdown at the top right of the version page
3. Under **Build**, **Add Build** -> attach the build that just arrived. Only
   builds whose version string matches the version record are offered, so for
   `1.1.0` there is normally exactly one candidate
4. **Version Release** -> *Automatically release this version*, and tick
   **Phased Release for Automatic Updates** to spread it over 7 days
5. Check **App Review Information**. If *Sign-in required* is ticked, the demo
   account there must still log in against the **live** backend. A dead demo
   account is the most common rejection, and it is invisible until Apple tries
   it
6. **Save** -> **Add for Review** -> **Submit to App Review**

Apple review is typically 24-48 hours.

Export compliance is already answered by the binary
(`ITSAppUsesNonExemptEncryption: false` in `app.json`), so no encryption
questionnaire appears.

The fastest way to check a build on a real iPhone, when you want one: TestFlight
**Internal Testing**. Add yourself under *Users and Access*, tick the build, and
it installs through the TestFlight app minutes after processing — internal
testers need **no** Beta App Review. Only external testers do.

---

## 3. Store listing vs. the app

Two separate things, often confused:

- **App icons / splash / notification icon** live in `mobile/assets/` and are
  baked into the binary. Changing them needs a **new build**.
  Never edit `android/app/src/main/res/` — `/android` and `/ios` are gitignored
  and regenerated by prebuild, so edits there are wiped.
- **Screenshots, feature graphic, description, app title** are **store listing
  metadata** — no new build needed, but the two stores treat them differently:
  - **Google Play:** edit any time (Grow users -> Store presence -> Store
    listings). Changes go through a short listing review, no new release needed.
  - **App Store:** description, keywords and screenshots belong to a *version*
    and are **locked once that version is live**. Changing them later means
    creating a new version, which needs a new build. Only **Promotional Text**
    can be edited at any time. So update screenshots/description *while* a
    version is still in "Prepare for Submission".

Copy for every field, in English and Arabic, is in `STORE_LISTING.md`.

Keep an Arabic localization on both store listings. Without one, Arabic users
see the English description.

---

## 4. Over-the-air (OTA) updates

`app.json` sets `runtimeVersion: { policy: "appVersion" }`, which means the OTA
channel is tied to `expo.version`.

```bash
npx eas update --branch production --message "what changed"
```

- Only ships **JavaScript**. Anything touching native code, new dependencies, or
  `app.json` native config needs a real build. Dark mode in 1.1.0 is the clean
  example: the styling was JavaScript, but `userInterfaceStyle: "automatic"` and
  the `expo-system-ui` plugin are native config, so it could not have been an
  OTA update.
- An update published for `1.1.0` reaches **only** `1.1.0` installs. Bump
  `version` and the previous OTA channel is orphaned.
- Not used for 1.0.1 or 1.1.0 so far, but it is the escape hatch if a
  JavaScript-only bug turns up in a release that is already live — no new build,
  no new review.

---

## 5. Local testing before a release

`mobile/.env` points at production. To test against your own machine, create
`mobile/.env.local` (gitignored, overrides `.env`):

```bash
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000
EXPO_PUBLIC_SOCKET_URL=http://<your-lan-ip>:3000
```

```bash
cd pharma-stock && npm run dev          # server.ts, not `next dev` — Socket.IO
cd mobile        && npx expo start --dev-client -c
```

Gotchas:

- Allow Node through **Windows Firewall** on Private networks, or the phone
  cannot reach port 3000.
- Don't use the `local` EAS profile for LAN testing: it builds a release APK,
  and cleartext HTTP is only permitted in debug builds. Use the dev client.
- **RTL changes need a cold start, not a reload.** Switching to Arabic on iOS
  shows a "Restart Required" alert — force-quit the app and reopen. That is the
  fix working as designed, not a bug.
- **A leftover `mobile/android/` folder silently wins over `app.json`.** If an
  old `npx expo prebuild` left that directory behind, `npx expo run:android`
  reuses its stale native config — an old `versionCode`, a missing
  `userInterfaceStyle` — and you debug a bug that exists only locally. Both
  `/android` and `/ios` are gitignored, so EAS cloud builds are never affected.
  Delete the folder rather than editing it.

---

## 6. Release history

| Version | Code | Shipped | What it was |
|---|---|---|---|
| 1.0.0 | 1 | Aug 2026 | First release |
| 1.0.1 | 4 | Sep 2026 | Arabic + RTL, Daily Updates day picker. versionCode 3 was rejected as already live, so Android was rebuilt as 4 |
| 1.1.0 | 5 | Oct 2026 | Stock search, watchlist, company announcements, news search by symbol, dark mode. Needed a backend migration (`stocks_watchlist_announcements.sql`). Submitted without a TestFlight pass, with iOS phased release on and a staged Play rollout. The App Store description still carries the 1.0.1 text — the 1.1.0 copy in `STORE_LISTING.md` goes up with the next version |
