import React from "react";
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
} from "lucide-react";
import { Button, ProgressBar } from "../components/ui";

export default function Profile() {
  const rows = [
    ["My Achievements", Award, "/achievements"],
    ["Game History", Gamepad2, "/games"],
    ["Learning Progress", BookOpen, "/learn"],
    ["Settings", Settings, "#"],
    ["Help & Support", CircleHelp, "#"],
  ];
  return (
    <div className="container-app py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-card">
          <div className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-heritage-cream ring-4 ring-emerald-100">
            <img
              src="/assets/explorer-mobile.jpg"
              alt="Explorer avatar"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <h1 className="mt-5 font-display text-3xl font-extrabold">Oviya</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Proud to Explore India’s Heritage 🇮🇳
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <Stat n="12" l="Levels" />
            <Stat n="5" l="Badges" />
            <Stat n="1,620" l="XP" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Mini icon={Coins} n="1,250" l="Coins" />
            <Mini icon={Flame} n="4 days" l="Streak" />
          </div>
          <ProgressBar
            value={68}
            label="Overall learning progress"
            className="mt-7 text-left"
          />
          <Button
            as={Link}
            to="/play/quiz/ancient-india"
            className="mt-6 w-full"
          >
            Continue Learning <ChevronRight className="h-4 w-4" />
          </Button>
        </aside>
        <section className="space-y-6">
          <div className="rounded-[2rem] bg-heritage-forest p-7 text-white sm:p-9">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100">
                  <Sparkles className="h-4 w-4" /> Explorer summary
                </div>
                <h2 className="mt-3 font-display text-3xl font-extrabold">
                  Your Heritage Quest is growing.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                  Complete two more learning sessions this week to reach your
                  next reward milestone.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-center">
                <Target className="mx-auto h-6 w-6 text-heritage-gold" />
                <div className="mt-2 text-2xl font-extrabold">4/6</div>
                <div className="text-[11px] text-white/60">weekly goal</div>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold">Recent progress</h2>
                <BookOpen className="h-5 w-5 text-heritage-green" />
              </div>
              <div className="mt-5 space-y-5">
                <ProgressBar value={80} label="Monuments" />
                <ProgressBar value={65} label="Dynasties" />
                <ProgressBar value={55} label="Civilizations" />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold">Current target</h2>
                <Trophy className="h-5 w-5 text-heritage-gold" />
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-500">
                Finish one complete 10-question chapter to move toward your next
                achievement.
              </p>
              <ProgressBar value={68} className="mt-5" />
              <Link
                to="/leaderboard"
                className="focus-ring mt-5 inline-flex rounded-xl text-sm font-extrabold text-heritage-green"
              >
                View leaderboard →
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
