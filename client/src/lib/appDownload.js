export const ANDROID_APK_URL =
  "https://github.com/Gracejanani/heritage-quest/releases/download/android-v1.0.0/Heritage-Quest.apk";

const ANDROID_APP_USER_AGENT = "HeritageQuestAndroid/";

export function isRunningInHeritageQuestApp() {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator?.userAgent || "";
  const hasHeritageQuestUserAgent = userAgent.includes(ANDROID_APP_USER_AGENT);
  const isCapacitorNative = Boolean(
    window.Capacitor?.isNativePlatform?.(),
  );

  return hasHeritageQuestUserAgent || isCapacitorNative;
}
