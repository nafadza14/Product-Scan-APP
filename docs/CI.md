# CI

One codebase, three targets. Vercel deploys the web app on every push to `main`, and installed
Android/iOS apps pick that up through live updates. GitHub Actions only has to (a) prove the web
app still passes QA and (b) build new store binaries when native code changes.

## Workflows

| Workflow | Runs on | What it does |
| --- | --- | --- |
| `web-qa.yml` | Every push and PR to `main` | `npm ci`, `npm run build`, starts `vite preview` on :4173, runs `qa/e2e.py` (Playwright, Chromium). On failure, screenshots and `report.json` from `qa/out` are uploaded as the `qa-out-<run>` artifact. |
| `android.yml` | Push/PR to `main` touching `android/**`, `package.json`, `package-lock.json`, `capacitor.config.ts`; or manual | Builds the web app with `VITE_API_BASE=https://app.scanything.online`, `npx cap sync android`, then `assembleDebug` (always). With the keystore secrets: signed `bundleRelease` (AAB). With the Play secret too: uploads the AAB to the Play **internal** track. |
| `ios.yml` | Same, with `ios/**` instead of `android/**`; or manual | Same web build, `npx cap sync ios`, unsigned simulator build of `ios/App/App.xcodeproj` (scheme `App`, Swift Package Manager, no CocoaPods). With all App Store Connect secrets: archive, export IPA, upload to TestFlight. |

Release steps never run on pull requests. Without secrets every workflow still goes green; it just
skips the release steps.

To build on demand: GitHub, **Actions**, pick the workflow, **Run workflow**.

Versioning: Android `versionCode` and iOS build number are the workflow run number, so every
upload is higher than the last. The user-visible version (`versionName` / `CFBundleShortVersionString`)
comes from `"version"` in `package.json`; bump it before a store release.

## Install the test APK on an Android phone

1. GitHub, **Actions**, **Android**, open the latest green run.
2. Under **Artifacts**, download `scanything-debug-apk-<run>` (a zip containing `app-debug.apk`).
3. Unzip, copy the APK to the phone (or open the run page on the phone and download there).
4. Open the APK and allow "Install unknown apps" for your browser/file manager when asked.

The debug APK is signed with a throwaway debug key, so uninstall it before installing a Play build.
Artifacts are kept for 30 days.

## Secrets

Add them in GitHub: repo **Settings**, **Secrets and variables**, **Actions**, **New repository secret**.
All are optional.

### Web build (optional)

| Secret | Value |
| --- | --- |
| `VITE_REVENUECAT_ANDROID_KEY` | RevenueCat public Android SDK key (`goog_...`) |
| `VITE_REVENUECAT_IOS_KEY` | RevenueCat public iOS SDK key (`appl_...`) |

The Supabase publishable key is in the code; nothing else is needed. Optional repository
**variables** (not secrets): `VITE_PAYWALL_MODE`, `VITE_AMAZON_TAG`, `VITE_SHOPEE_AFF_ID`.

### Android release

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | The upload keystore file, base64 encoded |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias, e.g. `upload` |
| `ANDROID_KEY_PASSWORD` | Key password (same as the keystore password if you used one password) |
| `PLAY_SERVICE_ACCOUNT_JSON` | Optional. Full JSON of a Google Cloud service account with release access in Play Console |

Create the upload keystore once (needs a JDK; Android Studio ships one) and back it up somewhere safe.
Losing it means asking Google to reset the upload key.

```sh
keytool -genkeypair -v -keystore scanything-upload.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Base64 encode it:

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("scanything-upload.jks")) | Set-Clipboard
```

```sh
# macOS
base64 -i scanything-upload.jks | pbcopy
```

Paste the clipboard into `ANDROID_KEYSTORE_BASE64`.

Google Play upload:
1. Create the app in Play Console (package `online.scanything.app`) and upload the first AAB
   by hand from the `scanything-release-aab-<run>` artifact, enrolling in Play App Signing.
2. Google Cloud console: create a service account, create a JSON key for it.
3. Play Console, **Users and permissions**, invite the service account email, grant release
   permissions for the app.
4. Paste the whole JSON file into `PLAY_SERVICE_ACCOUNT_JSON`.

Play accepts only `draft` releases until the app has been published once, so uploads land as
drafts on the internal track. After the first publish, add the repository variable
`PLAY_RELEASE_STATUS=completed` to have each upload roll out to internal testers automatically.

### iOS release (TestFlight)

All six are needed; if any is missing only the simulator build runs.

| Secret | Value |
| --- | --- |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID of an App Store Connect API key |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID shown above the keys list |
| `APP_STORE_CONNECT_API_KEY_P8` | Full text of the downloaded `AuthKey_XXXX.p8` file (including the BEGIN/END lines) |
| `IOS_DIST_CERT_P12_BASE64` | Apple Distribution certificate + private key exported as `.p12`, base64 encoded |
| `IOS_DIST_CERT_PASSWORD` | Password you set when exporting the `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | App Store provisioning profile for `online.scanything.app`, base64 encoded |

How to get them:
1. **API key**: App Store Connect, **Users and Access**, **Integrations**, **App Store Connect API**,
   generate a key with the **App Manager** role. Download the `.p8` (only possible once).
2. **Distribution certificate**: developer.apple.com, **Certificates**, create an **Apple Distribution**
   certificate (needs a CSR from Keychain Access on a Mac), install it, then in Keychain Access
   right-click the certificate (with its private key) and **Export** as `.p12` with a password.
3. **Provisioning profile**: developer.apple.com, **Profiles**, new **App Store Connect** profile for
   the App ID `online.scanything.app` using that certificate. Download the `.mobileprovision`.
4. Create the app record in App Store Connect with bundle ID `online.scanything.app`.

Base64 encode the `.p12` and the profile:

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("dist.p12")) | Set-Clipboard
[Convert]::ToBase64String([IO.File]::ReadAllBytes("Scanything_AppStore.mobileprovision")) | Set-Clipboard
```

```sh
# macOS
base64 -i dist.p12 | pbcopy
base64 -i Scanything_AppStore.mobileprovision | pbcopy
```

The workflow reads the team ID and profile name from the profile itself, switches the App target
to manual signing on the runner only (nothing is committed), and deletes the temporary keychain
and profile at the end. Builds appear in TestFlight after Apple finishes processing (usually 5 to 30 minutes).
