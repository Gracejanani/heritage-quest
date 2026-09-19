import React from "react";
import {
  Flame,
  LockKeyhole,
  Map,
  Medal,
  Puzzle,
  Star,
  Trophy,
} from "lucide-react";
import { achievements } from "../data/content";
import { ProgressBar } from "../components/ui";

const icons = { Medal, Trophy, Star, Puzzle, Flame, Map };
export default function Achievements() {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <div className="container-app py-12 sm:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-amber-800">
            <Medal className="h-4 w-4" /> REWARDS
          </div>
          <h1 className="mt-4 font-display text-5xl font-extrabold">
            Your Achievements
          </h1>
          <p className="mt-3 text-slate-600">
            Celebrate learning milestones and see what to unlock next.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-2xl font-extrabold text-heritage-green">
            {unlocked}/{achievements.length}
          </div>
          <div className="text-xs font-bold text-slate-400">
            badges unlocked
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const Icon = icons[a.icon] || Star;
          const pct = Math.round((a.current / a.target) * 100);
          return (
            <article
              key={a.name}
              className={`relative overflow-hidden rounded-[2rem] border p-6 transition hover:-translate-y-1 ${a.unlocked ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-card" : "border-slate-200 bg-slate-100/70 opacity-80"}`}
            >
              <div
                className={`grid h-16 w-16 place-items-center rounded-2xl ${a.unlocked ? "badge-pop bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-500"}`}
              >
                {a.unlocked ? (
                  <Icon className="h-8 w-8" />
                ) : (
                  <LockKeyhole className="h-7 w-7" />
                )}
              </div>
              <h2 className="mt-5 text-xl font-extrabold">{a.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{a.detail}</p>
              <ProgressBar value={pct} className="mt-5" />
              <div className="mt-2 text-xs font-bold text-slate-400">
                {a.current} / {a.target}
              </div>
              {a.unlocked && (
                <div className="absolute right-5 top-5 rounded-full bg-heritage-green px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                  Unlocked
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
