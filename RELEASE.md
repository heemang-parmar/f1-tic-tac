# Releasing Grid Tac Toe to the App Store and Google Play

The native apps are [Capacitor](https://capacitorjs.com) shells around the web game in `www/`.
All game code lives in `www/`. The `ios/` and `android/` projects just package it.

## 0. One-time setup on your Mac

1. **Xcode** (latest, from the Mac App Store). Open it once to install components.
2. **Android Studio** (https://developer.android.com/studio). It bundles the Android SDK and a JDK.
3. **Node.js 22+** (`brew install node`).
4. Clone the repo and install:
   ```bash
   git clone https://github.com/heemang-parmar/f1-tic-tac.git && cd f1-tic-tac
   git checkout claude/f1-tictactoe-mobile-game-h7eras   # until it's merged
   npm install
   ```

> The bundle ID / package name is `com.oneinfinitylabs.gridtactoe`. It **cannot be changed after the first
> upload** to either store. To use a different one, change it now in `capacitor.config.json`,
> `android/app/build.gradle` (`namespace` + `applicationId`), and in Xcode (Signing & Capabilities → Bundle Identifier).

Whenever you change anything in `www/`, run `npx cap sync` before building, so both native projects get the new files.

---

## 1. iOS → App Store

### a. Register the app (once)
1. https://developer.apple.com/account → **Identifiers** → **+** → App IDs → App.
   Description `Grid Tac Toe`, Bundle ID **explicit** `com.oneinfinitylabs.gridtactoe`. No capabilities needed.
2. https://appstoreconnect.apple.com → **Apps** → **+ New App**: platform iOS, name `Grid Tac Toe`,
   language English, the bundle ID above, SKU `gridtactoe`.

### b. Build and upload
```bash
npm run ios            # syncs and opens ios/App/App.xcodeproj in Xcode
```
In Xcode:
1. Select the **App** target → **Signing & Capabilities** → check *Automatically manage signing*, pick your **Team**.
2. Choose a connected iPhone or simulator and press **▶ Run** to try it on a device first. Check sound, haptics and the notch area.
3. Set the run destination to **Any iOS Device (arm64)**.
4. **Product → Archive**. When the Organizer opens: **Distribute App → App Store Connect → Upload**.

The first build takes a few minutes to process in App Store Connect.

### c. Submit
In App Store Connect → your app → version 1.0.0:
- Paste the text from [`STORE.md`](STORE.md) and upload the 5 screenshots from `store/ios-6.9/`.
- Pick the uploaded build, fill in **App Privacy** ("Data Not Collected") and the **age rating** (4+), as listed in STORE.md.
- **App Review Information:** no sign-in required. Notes: *"Single-player offline game. No account or network needed."*
- **Add for Review → Submit**. Optional: test first with **TestFlight** (internal testers need no review).

---

## 2. Android → Google Play

### a. Create your upload key (once — keep it safe)
```bash
keytool -genkeypair -v -keystore ~/gridtactoe-upload.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
```
Then create `android/keystore.properties` (this file is git-ignored, **never commit it**):
```properties
storeFile=/Users/<you>/gridtactoe-upload.jks
storePassword=<the password you chose>
keyAlias=upload
keyPassword=<the password you chose>
```
Back up the `.jks` file and its password in your password manager. Play App Signing holds the real
signing key, so if the upload key is lost Google can reset it, but that takes time.

### b. Build the release bundle
```bash
npm run android:bundle
# → android/app/build/outputs/bundle/release/app-release.aab
```
(Or `npm run android` to open Android Studio and run it on a phone or emulator first.)

### c. Create the app and upload
1. https://play.google.com/console → **Create app**: name `Grid Tac Toe`, Game, Free.
2. Complete **App content** (privacy policy, ads, data safety, content rating, target audience) using the
   answers in [`STORE.md`](STORE.md).
3. **Store listing:** paste the text, upload `store/android-icon-512.png`, the feature graphic and the
   `store/android-phone/` screenshots.
4. **Testing → Closed testing** (or **Internal testing** for a quick check) → create a release → upload `app-release.aab`.
   Accept **Play App Signing** when asked.
5. **Personal developer accounts** must run a closed test with **at least 12 testers for 14 days**
   before **Production** unlocks. Organization accounts can go straight to Production.
6. **Production → Create release** → upload the same `.aab` (or promote the tested release) → **Review and roll out**.

---

## 3. Shipping an update

1. Make changes in `www/`, then run `npm test`.
2. Bump the version in **both** places:
   - iOS: Xcode → App target → General → *Version* (e.g. `1.0.1`) and *Build* (`2`, `3`, … must increase).
   - Android: `android/app/build.gradle` → `versionName "1.0.1"`, `versionCode 2` (must increase).
3. `npx cap sync`, then archive and upload (iOS) and `npm run android:bundle` and upload (Android).
4. Redeploy the website too (it's a separate copy on Netlify).

## Regenerating icons, splash screens and screenshots

```bash
npm run assets         # from www/icons/icon.svg → PWA icons + all native icon/splash sizes
npm start &            # serve the game locally on :5173
npm run screenshots    # → store/ screenshots + Play feature graphic
```
