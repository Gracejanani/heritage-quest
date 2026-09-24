import React, { useEffect, useMemo, useState } from "react";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import { Badge, Select } from "../components/ui";
import { supabase } from "../lib/supabase";
import { usePlayer } from "../context/PlayerContext";

export default function Leaderboard() {
  const [period, setPeriod] = useState("Weekly");
  const [rows, setRows] = useState([]);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { player } = usePlayer();

  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      if (!supabase) {
        if (active) {
          setRows([]);
          setLoading(false);
          setError("Supabase is not available.");
        }
        return;
      }

      setLoading(true);
      setError("");

      const { data, error: leaderboardError } = await supabase.rpc(
        "get_dynamic_leaderboard",
        { p_period: period },
      );

      if (!active) return;

      if (leaderboardError) {
        console.error("Could not load leaderboard", leaderboardError);
        setRows([]);
        setError("Could not load the live leaderboard.");
      } else {
        setRows(
          (data || []).map((row) => ({
            rank: Number(row.rank || 0),
            userId: row.user_id,
            name: row.name || "Explorer",
            points: Number(row.points || 0),
            badges: Number(row.badges || 0),
            registeredDays: Number(row.registered_days || 1),
            current: Boolean(row.is_current),
          })),
        );
      }

      setLoading(false);
    };

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [period, player?.id]);

  useEffect(() => {
    let active = true;

    const loadWeeklyGoal = async () => {
      if (!supabase) return;

      const { data, error: weeklyError } = await supabase.rpc(
        "get_dynamic_leaderboard",
        { p_period: "Weekly" },
      );

      if (!active || weeklyError) return;

      const current = (data || []).find((row) => row.is_current);
      setWeeklyPoints(Number(current?.points || 0));
    };

    loadWeeklyGoal();

    return () => {
      active = false;
    };
  }, [player?.id]);

  const currentRow = useMemo(
    () => rows.find((row) => row.current),
    [rows],
  );

  const weeklyGoal = 700;
  const weeklyGoalProgress = Math.min(
    100,
    Math.round((weeklyPoints / weeklyGoal) * 100),
  );

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-amber-800">
            <Trophy className="h-4 w-4" /> LIVE SUPABASE RANKING
          </div>
          <h1 className="mt-4 font-display text-5xl font-extrabold text-slate-950">
            Leaderboard
          </h1>
          <p className="mt-3 text-slate-600">
            Real student rankings calculated from quiz scores stored in Supabase.
          </p>
        </div>

        <Select
          value={period}
          onChange={setPeriod}
          options={["Daily", "Weekly", "All Time"]}
          className="w-40"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
          <div className="grid grid-cols-[64px_1fr_90px_80px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500 sm:grid-cols-[80px_1fr_120px_110px]">
            <span>Rank</span>
            <span>Explorer</span>
            <span>Badges</span>
            <span className="text-right">Points</span>
          </div>

          {loading && (
            <div className="px-6 py-12 text-center font-semibold text-slate-500">
              Loading live scores…
            </div>
          )}

          {!loading && error && (
            <div className="px-6 py-12 text-center font-semibold text-rose-600">
              {error}
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              No student scores are available yet.
            </div>
          )}

          {!loading &&
            !error &&
            rows.map((row) => (
              <div
                key={row.userId}
                className={`grid grid-cols-[64px_1fr_90px_80px] items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[80px_1fr_120px_110px] ${
                  row.current ? "bg-emerald-50" : ""
                }`}
              >
                <div className="font-extrabold text-slate-600">
                  {row.rank <= 3 ? (
                    <span
                      className={`inline-grid h-9 w-9 place-items-center rounded-full ${
                        row.rank === 1
                          ? "bg-amber-100 text-amber-600"
                          : row.rank === 2
                            ? "bg-slate-200 text-slate-600"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {row.rank === 1 ? (
                        <Crown className="h-5 w-5" />
                      ) : (
                        <Medal className="h-5 w-5" />
                      )}
                    </span>
                  ) : (
                    `#${row.rank}`
                  )}
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-extrabold ${
                      row.current
                        ? "bg-heritage-green text-white"
                        : "bg-heritage-cream text-heritage-brown"
                    }`}
                  >
                    {row.name.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-extrabold text-slate-900">
                      {row.name}
                      {row.current && <Badge className="ml-2">You</Badge>}
                    </div>
                    <div className="text-xs text-slate-400">
                      Day {row.registeredDays} of learning
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Award className="h-4 w-4 text-heritage-gold" />
                  {row.badges}
                </div>

                <div className="text-right font-extrabold text-heritage-green">
                  {row.points}
                </div>
              </div>
            ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-heritage-forest p-6 text-white">
            <Trophy className="h-9 w-9 text-heritage-gold" />
            <h2 className="mt-4 text-xl font-extrabold">This week’s goal</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Reach {weeklyGoal} points to unlock your next heritage milestone.
            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-heritage-gold transition-all"
                style={{ width: `${weeklyGoalProgress}%` }}
              />
            </div>

            <div className="mt-2 text-xs font-bold text-white/70">
              {weeklyPoints} / {weeklyGoal} points
            </div>

            {currentRow && (
              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
                Your {period.toLowerCase()} rank: #{currentRow.rank}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-extrabold">How ranking works</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Rankings now come from real quiz score records in Supabase.
              Daily and weekly views use recently updated quiz progress, while
              All Time uses the student’s full saved score.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
