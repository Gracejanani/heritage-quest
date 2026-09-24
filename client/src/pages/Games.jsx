import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Gamepad2,
  Puzzle,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useLiveGames } from "../lib/liveContent";
import GameCard from "../components/GameCard";
import { Badge, SearchBar, Select } from "../components/ui";

export default function Games() {
  const games = useLiveGames();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get("mode");

  const [query, setQuery] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [difficulty, setDifficulty] = useState("All");

  const quizGames = useMemo(
    () => games.filter((game) => game.slug !== "heritage-word-quest"),
    [games],
  );

  const categories = [
    "All",
    ...Array.from(new Set(quizGames.map((game) => game.category))).filter(Boolean),
  ];

  const filtered = useMemo(
    () =>
      quizGames.filter((game) => {
        const search = query.toLowerCase().trim();
        const searchable = `${game.title} ${game.description || ""} ${game.category || ""} ${Array.isArray(game.learn) ? game.learn.join(" ") : ""}`;
        const matchQuery = !search || searchable.toLowerCase().includes(search);
        const matchCategory =
          category === "All" || game.category === category;
        const matchDifficulty =
          difficulty === "All" || game.difficulty === difficulty;

        return matchQuery && matchCategory && matchDifficulty;
      }),
    [quizGames, query, category, difficulty],
  );

  const openQuizLibrary = () => {
    navigate("/games?mode=quiz");
    setQuery("");
    setCategory("All");
    setDifficulty("All");
  };

  const openWordQuest = () => {
    navigate("/play/word-quest");
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="rounded-[2rem] bg-heritage-forest px-6 py-10 text-white sm:px-10 lg:px-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
          <Gamepad2 className="h-4 w-4" /> CHOOSE YOUR GAME
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
          Learn through two game modes
        </h1>
        <p className="mt-3 max-w-2xl text-white/70">
          Choose the chapter quiz experience or build heritage answers from
          mixed letters in Heritage Word Quest.
        </p>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <button
          type="button"
          onClick={openQuizLibrary}
          className={`group overflow-hidden rounded-[2rem] border-2 bg-white text-left transition duration-300 hover:-translate-y-1 hover:shadow-card ${
            mode === "quiz"
              ? "border-heritage-green ring-4 ring-emerald-100"
              : "border-slate-200 hover:border-emerald-300"
          }`}
        >
          <div className="grid min-h-[250px] grid-cols-[1fr_auto] gap-5 bg-gradient-to-br from-emerald-50 via-white to-heritage-cream p-7 sm:p-9">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-800">
                <BookOpenCheck className="h-4 w-4" /> Game mode 1
              </div>
              <h2 className="mt-5 font-display text-3xl font-extrabold text-slate-950 sm:text-4xl">
                Quiz Challenges
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Pick a heritage chapter and answer age-appropriate questions
                with hints, explanations, XP and certificates.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 font-extrabold text-heritage-green">
                Open quiz games <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </div>
            </div>

            <div className="hidden h-28 w-28 place-items-center self-center rounded-[2rem] bg-heritage-green text-white shadow-soft sm:grid">
              <Gamepad2 className="h-14 w-14" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={openWordQuest}
          className="group overflow-hidden rounded-[2rem] border-2 border-slate-200 bg-white text-left transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-card"
        >
          <div className="grid min-h-[250px] grid-cols-[1fr_auto] gap-5 bg-gradient-to-br from-sky-50 via-white to-blue-100 p-7 sm:p-9">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-sky-800">
                <Puzzle className="h-4 w-4" /> Game mode 2
              </div>
              <h2 className="mt-5 font-display text-3xl font-extrabold text-slate-950 sm:text-4xl">
                Heritage Word Quest
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Read a heritage clue, then tap the shuffled letters in the
                correct order to build the answer.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 font-extrabold text-sky-700">
                Play Word Quest <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </div>
            </div>

            <div className="hidden h-32 w-40 overflow-hidden rounded-[1.75rem] border border-sky-200 bg-white shadow-soft sm:block">
              <img
                src="/assets/games/word-quest.svg"
                alt="Heritage Word Quest letter tiles"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </button>
      </section>

      {mode === "quiz" && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate("/games")}
                className="focus-ring inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 hover:text-heritage-green"
              >
                <ArrowLeft className="h-4 w-4" /> Choose another game mode
              </button>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-950">
                Quiz game library
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a chapter challenge to begin.
              </p>
            </div>

            <Badge tone="gold">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" />
              {quizGames.length} quiz games
            </Badge>
          </div>

          <div className="sticky top-[76px] z-30 mt-6 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-soft backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search quiz games or topics..."
              />
              <Select
                value={category}
                onChange={setCategory}
                options={categories}
                ariaLabel="Filter by category"
              />
              <Select
                value={difficulty}
                onChange={setDifficulty}
                options={["All", "Medium", "Advanced"]}
                ariaLabel="Filter by difficulty"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {filtered.length} matching quiz games
              </span>
              <span>Questions are selected according to the student's age group.</span>
            </div>
          </div>

          {filtered.length ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-lg font-extrabold">
                No quiz games match those filters.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another search, category or difficulty.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
