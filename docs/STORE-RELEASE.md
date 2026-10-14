# Store release: Google Play and App Store

Scanything ships as one Capacitor 8 app on both stores.

| | Value |
|---|---|
| App name | Scanything |
| Android applicationId / iOS bundle id | `online.scanything.app` |
| Deep link (Google sign-in) | `online.scanything.app://auth-callback` |
| Live update manifest | `https://app.scanything.online/ota/latest.json` (see `docs/LIVE-UPDATES.md`) |

## What needs a store release, and what does not

- **Web-only changes** (anything under `components/`, `services/`, styles, copy, translations) reach installed apps through live updates. Deploy the web app and the apps pick up the new bundle in the background. No store review.
- **Native changes need a new store version**: adding, removing or upgrading a Capacitor plugin, new permissions or `Info.plist` / `AndroidManifest.xml` entries, `capacitor.config.ts` changes, icons and splash, the Capacitor version itself. In the same commit, bump `NATIVE_LEVEL` in `services/liveUpdate.ts` so older binaries skip bundles they cannot run.
- Store policy allows live updates of the web layer as long as they do not change the app's main purpose (Apple guideline 3.3.1(b) / 2.5.2, Google Play Device and Network Abuse policy). Ship feature changes that reviewers would treat as a new app through the store.

## Versioning

Both platforms take their version from the environment, so CI sets it and nothing is edited by hand.

| | Android (`android/app/build.gradle`) | iOS (Xcode build settings) |
|---|---|---|
| User-visible version | `VERSION_NAME` env (default `1.0.0`) | `MARKETING_VERSION` (default `1.0`) |
| Build number, must go up on every upload | `VERSION_CODE` env (default `1`) | `CURRENT_PROJECT_VERSION` (default `1`) |

On iOS, pass the settings on the `xcodebuild` command line, which overrides the project values: `MARKETING_VERSION=1.2.0 CURRENT_PROJECT_VERSION=42`. The CI workflows (`docs/CI.md`) already do this on both platforms: the version comes from `package.json` `version` and the build number from the GitHub run number. To release a new version, bump `version` in `package.json`.

## Google Play: one-time setup

1. **Create the app** in Play Console: name Scanything, default language, App, Free (subscriptions are in-app). Package name is fixed by the first upload: `online.scanything.app`.
2. **Play App Signing**: keep it on (default). Google holds the app signing key. You sign uploads with an *upload key*.
3. **Create the upload keystore** (once, keep it and the passwords in a password manager; losing it means a key reset request to Google):

   ```sh
   keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 \
     -keystore scanything-upload.jks -alias upload \
     -dname "CN=Scanything, O=PT. Bantu Indonesia Technology, L=Yogyakarta, C=ID"
   ```

   Keystores are git-ignored (`android/.gitignore`). For CI, add it as the `ANDROID_KEYSTORE_BASE64` secret plus the password and alias secrets listed in `docs/CI.md`.
4. **Release build** reads signing from the environment; when any variable is missing the release build is unsigned and debug builds are unaffected:

   ```sh
   export ANDROID_KEYSTORE_PATH=/abs/path/scanything-upload.jks
   export ANDROID_KEYSTORE_PASSWORD=... ANDROID_KEY_ALIAS=upload ANDROID_KEY_PASSWORD=...
   export VERSION_CODE=1 VERSION_NAME=1.0.0
   npm run build && npx cap sync android
   cd android && ./gradlew bundleRelease
   # -> android/app/build/outputs/bundle/release/app-release.aab
   ```

5. **First upload by hand** to the Internal testing track (Play requires the first AAB through the console). After that, CI publishes with a Google Cloud service account (setup in `docs/CI.md`).
6. **Subscriptions**: create the products in Play Console > Monetize, then link Play to RevenueCat (service account credentials JSON in the RevenueCat dashboard) so purchases validate.
7. **App content** forms: privacy policy URL, ads (No), app access (give the demo account, see below), content rating, target audience (18+ or 13+; not a children's app), Data safety (answers below), Health apps declaration (wellness / nutrition and skin care, not a medical device), Financial features (none).

## App Store: one-time setup

1. **Register the bundle id** in Apple Developer > Certificates, Identifiers & Profiles > Identifiers: explicit App ID `online.scanything.app`. In-App Purchase is on by default; no other capability is needed (the auth deep link is a custom URL scheme, not Associated Domains).
2. **Create the app** in App Store Connect > Apps > New App: iOS, name Scanything, bundle id `online.scanything.app`, SKU e.g. `scanything-ios`.
3. **Signing and upload from CI**: `docs/CI.md` lists the six secrets (App Store Connect API key, Apple Distribution certificate `.p12`, App Store provisioning profile) and how to create them. The `ios.yml` workflow switches the App target to manual signing on the runner only, archives with the version settings above and uploads to TestFlight. The committed project stays on automatic signing with no `DEVELOPMENT_TEAM`.
4. **Local build** (macOS, Xcode 16+): `npm run build && npx cap sync ios`, open `ios/App/App.xcodeproj`, pick your team under Signing & Capabilities (do not commit that change), set the version in the target's General tab if needed, then Product > Archive > Distribute App > App Store Connect.
5. **Subscriptions**: create the subscription group and products in App Store Connect, add the App Store Connect in-app purchase key to RevenueCat, and sign the Paid Applications agreement (purchases fail in review without it).
6. **Encryption**: `ITSAppUsesNonExemptEncryption` is `false` in `Info.plist` (HTTPS only), so no export compliance question per build.
7. **Privacy manifest**: `ios/App/App/PrivacyInfo.xcprivacy` is in the app target's resources. Keep it in line with the App Privacy answers below.

## Privacy answers

Both stores ask the same questions in different shapes. What the app actually handles:

| Data | Where it comes from | Where it goes | Required? |
|---|---|---|---|
| Email address, name | Account sign-up (email or Google) | Supabase auth | Optional (the app works without an account) |
| User ID | Account id, reused as RevenueCat app user id | Supabase, RevenueCat | Optional |
| Health info | Conditions, pregnancy/breastfeeding, skin type, age range entered in onboarding and profile | Device storage; Supabase when signed in; sent with scans to the AI analysis endpoint | Optional |
| Photos | Label, meal and skin photos from camera or library | Sent to our `/api/chat` endpoint for AI analysis; skin photos backed up to private Supabase storage when signed in | Optional, needed for scanning |
| Other user content | Diary logs, routines, goals, favourites | Device storage; Supabase when signed in | Optional |
| Purchase history | Subscriptions | Apple / Google, RevenueCat | Only for subscribers |

No ads, no ad SDKs, no tracking, no data sold. Service providers (Supabase, the AI model provider behind `/api/chat`, RevenueCat, Vercel) process data on our behalf, which both stores treat as not "shared". All traffic is HTTPS.

Before submitting, check `capacitor.config.ts`: `@capgo/capacitor-updater` sends update statistics with a random device id to `plugin.capgo.app` unless `CapacitorUpdater.statsUrl` is set to `''`. Keep it disabled, or add "Device or other IDs / Diagnostics" to both forms.

**Google Play Data safety**

- Does the app collect or share user data: Yes, collects. Shared with third parties: No.
- Encrypted in transit: Yes. Users can request deletion: Yes (needs the in-app option and a web URL, see Open items).
- Personal info: Name, Email address, User IDs. Purpose: App functionality, Account management. Optional.
- Health and fitness: Health info. Purpose: App functionality, Personalization. Optional.
- Photos and videos: Photos. Purpose: App functionality. Optional. Not processed ephemerally (backup).
- App activity: Other user-generated content. Purpose: App functionality. Optional.
- Financial info: Purchase history. Purpose: App functionality.

**App Store App Privacy** (all items: Linked to the user, Not used for tracking, purpose App Functionality; add Product Personalization for Health if you prefer to mirror Play)

- Contact Info: Name, Email Address
- Health and Fitness: Health
- User Content: Photos or Videos, Other User Content
- Identifiers: User ID
- Purchases: Purchase History

## Review notes

Paste into App Store Connect > App Review Information > Notes, and Play Console > App access:

> Scanything is a wellness and lifestyle app. It reads product labels (food and skincare) and skin photos to explain ingredients and help users keep a personal diary. It does not diagnose, treat or prevent any disease and is not a medical device; the app shows this disclaimer in results.
>
> Camera is used for scanning labels and taking skin selfies; the photo library for choosing existing photos and for saving the progress card when the user taps save.
>
> Demo account (premium unlocked): email `review@scanything.online`, password `<set before submitting>`. Sign in from Profile. Sign-in is optional; all scanning works without an account.
>
> Subscriptions are handled with StoreKit / Google Play Billing; Restore Purchases is on the paywall.

Before each submission:

- Create the demo account in Supabase and grant it premium (RevenueCat promotional entitlement), so reviewers can see paid features without buying.
- Keep health wording wellness-only in the store listing and screenshots (no "diagnose", "treat", "cure", "medical-grade").
- Subscription metadata (Apple 3.1.2): price, period and links to the privacy policy and Terms of Use (EULA) must appear on the paywall and in the App Store description.
- Screenshots: iPhone 6.9" portrait is required. The project targets iPhone and iPad (`TARGETED_DEVICE_FAMILY = 1,2`), so 13" iPad screenshots are required too. If the iPad layout is not ready, switch the target to iPhone only before the first submission (it still runs on iPad in compatibility mode).

## Open items found while preparing the native projects

- **Account deletion**: both stores require users who can create an account to delete it from inside the app (Apple 5.1.1(v)), and Play also needs a public web page to request deletion. The app currently has no delete-account flow.
- **Privacy policy URL**: both stores need a standalone policy page. The landing page has a Privacy section only; publish e.g. `https://scanything.online/privacy`.
- **Sign in with Apple** (Apple 4.8): apps that offer Google sign-in must also offer a login option that keeps the email private and limits data to name and email. Email/password alone may not satisfy reviewers; adding Sign in with Apple is the safe route.
