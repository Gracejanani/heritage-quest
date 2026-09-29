# Heritage Quest Android App

Heritage Quest is packaged for Android with Capacitor.

## Test APK behavior

- App name: `Heritage Quest`
- Application ID: `com.gracekumar.heritagequest`
- Supported devices: Android 7.0 and newer (API 24+)
- Website: `https://heritage-quest-india.vercel.app`
- Internet access is required.
- The APK displays the current live Vercel deployment, so website updates appear in the app automatically.
- Supabase authentication and application data continue to use the existing live project.

This connected APK is intended for direct testing and private installation. A Play Store release should use bundled web assets, release signing, an Android App Bundle (`.aab`), a privacy policy, and store-ready versioning.

## Build locally

Install Node.js 22+, Android Studio 2025.2.1+, Android SDK 36, and Java 21. Then run:

```bash
cd client
npm ci
npm run build
npm run android:init
cd android
./gradlew assembleDebug
```

For later builds, after the Android project already exists, replace
`npm run android:init` with `npm run android:sync`.

The generated file is:

```text
client/android/app/build/outputs/apk/debug/app-debug.apk
```

## GitHub build

The `Build Heritage Quest APK` workflow builds the APK and saves it as the `Heritage-Quest-Android-APK` workflow artifact.
