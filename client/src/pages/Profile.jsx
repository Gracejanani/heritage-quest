import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
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
} from "lucide-react";
import { Button, ProgressBar } from "../components/ui";
import { usePlayer } from "../context/PlayerContext";
import { AGE_GROUPS } from "../lib/age";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const { player, switchPlayer, getSummary } = usePlayer();
  const summary = getSummary();
  const ageInfo = AGE_GROUPS[player?.ageGroup] || AGE_GROUPS.scholar;
  const [avatarUrl, setAvatarUrl] = useState("");

  const rows = [
    ["My Achievements", Award, "/achievements"],
    ["Game History", Gamepad2, "/games"],
    ["Learning Progress", BookOpen, "/learn"],
    ["Settings", Settings, "/settings"],
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

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-card">
          <div className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-heritage-cream ring-4 ring-emerald-100">
            <img
              src={avatarUrl || "/assets/explorer-mobile.jpg"}
              alt={`${player?.name || "Explorer"} profile`}
              className="h-full w-full object-cover"
            />
          </div>

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
