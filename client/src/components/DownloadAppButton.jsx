import React from "react";
import { Download } from "lucide-react";
import {
  ANDROID_APK_URL,
  isRunningInHeritageQuestApp,
} from "../lib/appDownload";

const variants = {
  primary:
    "bg-heritage-green text-white shadow-soft hover:bg-emerald-700",
  accent:
    "bg-heritage-saffron text-white shadow-soft hover:bg-orange-600",
  outline:
    "border border-heritage-green/25 bg-white text-heritage-green shadow-sm hover:bg-emerald-50",
  light:
    "border border-white/20 bg-white/10 text-white hover:bg-white/20",
};

export default function DownloadAppButton({
  label = "Download App",
  variant = "primary",
  className = "",
}) {
  if (isRunningInHeritageQuestApp()) return null;

  return (
    <a
      href={ANDROID_APK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${variants[variant] || variants.primary} ${className}`}
      aria-label="Download Heritage Quest for Android"
      title="Download Heritage Quest for Android"
      data-android-download
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
