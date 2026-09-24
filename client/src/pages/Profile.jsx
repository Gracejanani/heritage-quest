import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  Camera,
  ChevronRight,
  CircleHelp,
  Gamepad2,
  Settings,
  Sparkles,
  Target,
  Trophy,
  Coins,
  Flame,
  LogOut,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, ProgressBar, useToast } from "../components/ui";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { AGE_GROUPS } from "../lib/age";
import { supabase } from "../lib/supabase";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function extensionFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export default function Profile() {
  const { player, switchPlayer, getSummary } = usePlayer();
  const { refreshProfile } = useAuth();
  const toast = useToast();
  const summary = getSummary();
  const ageInfo = AGE_GROUPS[player?.ageGroup] || AGE_GROUPS.scholar;
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);

  const rows = [
    ["My Achievements", Award, "/achievements"],
    ["Game History", Gamepad2, "/games"],
    ["Learning Progress", BookOpen, "/learn"],
    ["Settings", Settings, "#"],
    ["Help & Support", CircleHelp, "#"],
  ];

  useEffect(() => {
    let active = true;

    const loadAvatar = async () => {
      if (!supabase || !player?.avatarPath) {
        if (active) setAvatarUrl("");
        return;
      }

      const { data, error } = await supabase.storage
        .from("profile-pictures")
        .createSignedUrl(player.avatarPath, 60 * 60);

      if (!active) return;

      if (error) {
        console.error("Could not load profile picture", error);
        setAvatarUrl("");
        return;
      }

      setAvatarUrl(data?.signedUrl || "");
    };

    loadAvatar();

    return () => {
      active = false;
    };
  }, [player?.avatarPath]);

  const uploadAvatar = async (file) => {
    if (!file || !player?.id || !supabase) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast("Please choose a JPG, PNG or WebP image.", "error");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast("Profile picture must be smaller than 5 MB.", "error");
      return;
    }

    setAvatarBusy(true);

    try {
      const extension = extensionFor(file);
      const path = `${player.id}/profile-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const previousPath = player.avatarPath || null;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_path: path,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", player.id);

      if (profileError) {
        await supabase.storage.from("profile-pictures").remove([path]);
        throw profileError;
      }

      if (previousPath && previousPath !== path) {
        await supabase.storage
          .from("profile-pictures")
          .remove([previousPath]);
      }

      await refreshProfile(player.id);
      toast("Profile picture updated.");
    } catch (error) {
      console.error(error);
      toast(error?.message || "Could not upload profile picture.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    if (!player?.id || !player?.avatarPath || !supabase) return;
    if (!window.confirm("Remove your profile picture?")) return;

    setAvatarBusy(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", player.id);

      if (profileError) throw profileError;

      const { error: storageError } = await supabase.storage
        .from("profile-pictures")
        .remove([player.avatarPath]);

      if (storageError) {
        console.error("Profile row updated, but old image could not be removed", storageError);
      }

      setAvatarUrl("");
      await refreshProfile(player.id);
      toast("Profile picture removed.");
    } catch (error) {
      console.error(error);
      toast(error?.message || "Could not remove profile picture.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-card">
          <div className="relative mx-auto h-28 w-28">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-heritage-cream ring-4 ring-emerald-100">
              <img
                src={avatarUrl || "/assets/explorer-mobile.jpg"}
                alt={`${player?.name || "Explorer"} profile`}
                className="h-full w-full object-cover"
              />
            </div>

            <label
              className={`focus-ring absolute bottom-0 right-0 grid h-10 w-10 cursor-pointer place-items-center rounded-full border-4 border-white bg-heritage-green text-white shadow-lg transition hover:bg-emerald-700 ${
                avatarBusy ? "pointer-events-none opacity-60" : ""
              }`}
              title={player?.avatarPath ? "Change profile picture" : "Add profile picture"}
              aria-label={player?.avatarPath ? "Change profile picture" : "Add profile picture"}
            >
              <Camera className="h-5 w-5" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={avatarBusy}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) await uploadAvatar(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <label
              className={`focus-ring inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-emerald-50 hover:text-heritage-green ${
                avatarBusy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Upload className="h-4 w-4" />
              {avatarBusy
                ? "Uploading…"
                : player?.avatarPath
                  ? "Change photo"
                  : "Add photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={avatarBusy}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) await uploadAvatar(file);
                  event.target.value = "";
                }}
              />
            </label>

            {player?.avatarPath && (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={avatarBusy}
                className="focus-ring inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>

          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            JPG, PNG or WebP · maximum 5 MB
          </p>

          <h1 className="mt-5 font-display text-3xl font-extrabold">{player?.name}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Proud to Explore India’s Heritage 🇮🇳
          </p>
          <div className="mt-3 space-y-1 text-xs font-bold text-slate-400">
            <p>{player?.email || "—"}</p>
            <p>Date of birth: {player?.dob || "—"}</p>
            <p>
              Age: {player?.age ?? "—"} · {ageInfo.label} ({ageInfo.range})
            </p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <Stat n={summary.completed} l="Chapters" />
            <Stat n={summary.badges} l="Badges" />
            <Stat n={summary.xp.toLocaleString()} l="XP" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Mini icon={Coins} n={summary.coins.toLocaleString()} l="Coins" />
            <Mini icon={Flame} n={summary.completed ? "Active" : "New"} l="Journey" />
          </div>
          <ProgressBar
            value={summary.overallProgress}
            label="Overall learning progress"
            className="mt-7 text-left"
          />
          <Button
            as={Link}
            to={`/play/quiz/${summary.latestChapter}`}
            className="mt-6 w-full"
          >
            {summary.completed ? "Continue Learning" : "Start Learning"} <ChevronRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={switchPlayer}
            className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-slate-500 hover:bg-orange-50 hover:text-heritage-saffron"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </aside>

        <section className="space-y-6">
          <div className="rounded-[2rem] bg-heritage-forest p-7 text-white sm:p-9">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100">
                  <Sparkles className="h-4 w-4" /> Explorer summary
                </div>
                <h2 className="mt-3 font-display text-3xl font-extrabold">
                  {summary.completed
                    ? `${player?.name}, your Heritage Quest is growing.`
                    : `Welcome, ${player?.name}. Your quest starts here.`}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                  Your profile, quiz progress, activity and rewards are linked
                  to your account. Supabase keeps the cloud record so you can
                  continue the same learning journey after logging in again.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-center">
                <Target className="mx-auto h-6 w-6 text-heritage-gold" />
                <div className="mt-2 text-2xl font-extrabold">{summary.completed}/12</div>
                <div className="text-[11px] text-white/60">chapters completed</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold">Your saved progress</h2>
                <BookOpen className="h-5 w-5 text-heritage-green" />
              </div>
              <div className="mt-5 space-y-5">
                <ProgressBar value={summary.overallProgress} label="All chapters" />
                <ProgressBar value={Math.min(100, summary.completed * 10)} label="Quest completion" />
                <ProgressBar value={Math.min(100, summary.badges * 16)} label="Achievement progress" />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold">Current target</h2>
                <Trophy className="h-5 w-5 text-heritage-gold" />
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-500">
                Finish a complete chapter to move toward your next achievement.
              </p>
              <ProgressBar value={summary.overallProgress} className="mt-5" />
              <Link
                to="/learn"
                className="focus-ring mt-5 inline-flex rounded-xl text-sm font-extrabold text-heritage-green"
              >
                Continue your chapters →
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {rows.map(([label, Icon, href]) => (
              <Link
                key={label}
                to={href}
                className="focus-ring flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-heritage-cream text-heritage-brown">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-bold text-slate-800">{label}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div className="rounded-2xl bg-heritage-cream p-3">
      <div className="text-xl font-extrabold text-heritage-green">{n}</div>
      <div className="text-[11px] font-bold text-slate-500">{l}</div>
    </div>
  );
}

function Mini({ icon: Icon, n, l }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-left">
      <Icon className="h-5 w-5 text-heritage-saffron" />
      <div>
        <div className="text-sm font-extrabold">{n}</div>
        <div className="text-[10px] font-bold text-slate-400">{l}</div>
      </div>
    </div>
  );
}
