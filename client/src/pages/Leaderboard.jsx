import React, { useMemo, useState } from "react";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import { leaderboard } from "../data/content";
import { Badge, Select, Tabs } from "../components/ui";

export default function Leaderboard() {
  const [scope, setScope] = useState("Friends");
  const [period, setPeriod] = useState("Weekly");
  const rows = useMemo(
    () =>
      leaderboard.map((r, i) => ({
        ...r,
        points:
          period === "Daily"
            ? Math.round(r.points * 0.18)
            : period === "All Time"
              ? r.points * 9 + i * 35
              : r.points,
      })),
    [period],
  );
  return (
    <div className="container-app py-12 sm:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-amber-800">
            <Trophy className="h-4 w-4" /> COMMUNITY
          </div>
          <h1 className="mt-4 font-display text-5xl font-extrabold text-slate-950">
            Leaderboard
          </h1>
          <p className="mt-3 text-slate-600">
            Learn, play, earn XP and climb the ranks.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Tabs
            items={["Friends", "Global"]}
            value={scope}
            onChange={setScope}
          />
          <Select
            value={period}
            onChange={setPeriod}
            options={["Daily", "Weekly", "All Time"]}
            className="w-36"
          />
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
          <div className="grid grid-cols-[64px_1fr_90px_80px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500 sm:grid-cols-[80px_1fr_120px_110px]">
            <span>Rank</span>
            <span>Explorer</span>
            <span>Badges</span>
            <span className="text-right">Points</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.rank}
              className={`grid grid-cols-[64px_1fr_90px_80px] items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[80px_1fr_120px_110px] ${r.current ? "bg-emerald-50" : ""}`}
            >
              <div className="font-extrabold text-slate-600">
                {r.rank <= 3 ? (
                  <span
                    className={`inline-grid h-9 w-9 place-items-center rounded-full ${r.rank === 1 ? "bg-amber-100 text-amber-600" : r.rank === 2 ? "bg-slate-200 text-slate-600" : "bg-orange-100 text-orange-700"}`}
                  >
                    {r.rank === 1 ? (
                      <Crown className="h-5 w-5" />
                    ) : (
                      <Medal className="h-5 w-5" />
                    )}
                  </span>
                ) : (
                  `#${r.rank}`
                )}
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-extrabold ${r.current ? "bg-heritage-green text-white" : "bg-heritage-cream text-heritage-brown"}`}
                >
                  {r.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-extrabold text-slate-900">
                    {r.name}
                    {r.current && <Badge className="ml-2">You</Badge>}
                  </div>
                  <div className="text-xs text-slate-400">{scope}</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                <Award className="h-4 w-4 text-heritage-gold" />
                {r.badges}
              </div>
              <div className="text-right font-extrabold text-heritage-green">
                {r.points}
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-5">
          <div className="rounded-3xl bg-heritage-forest p-6 text-white">
            <Trophy className="h-9 w-9 text-heritage-gold" />
            <h2 className="mt-4 text-xl font-extrabold">This week’s goal</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Reach 700 points to unlock a bonus heritage badge.
            </p>
            <div className="mt-5 h-2 rounded-full bg-white/15">
              <div className="h-full w-[88%] rounded-full bg-heritage-gold" />
            </div>
            <div className="mt-2 text-xs font-bold text-white/70">
              620 / 700 points
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-extrabold">How ranking works</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Earn points from quizzes, puzzles, learning streaks and daily
              challenges. Rankings reset by period, while achievements stay with
              your profile.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
