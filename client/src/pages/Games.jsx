import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Gamepad2, SlidersHorizontal, Sparkles } from "lucide-react";
import { useLiveGames } from "../lib/liveContent";
import GameCard from "../components/GameCard";
import { Badge, SearchBar, Select } from "../components/ui";

export default function Games() {
  const games = useLiveGames();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [difficulty, setDifficulty] = useState("All");
  const categories = [
    "All",
    "History",
    "Monuments",
    "Civilizations",
    "Dynasties",
    "Freedom Struggle",
    "States of India",
    "Art & Culture",
    "Festivals",
    "Famous Personalities",
    "Word Games",
  ];
  const filtered = useMemo(
    () =>
      games.filter((g) => {
        const q = query.toLowerCase().trim();
        const matchQ =
          !q ||
          `${g.title} ${g.description} ${g.category} ${g.learn.join(" ")}`
            .toLowerCase()
            .includes(q);
        const matchCat = category === "All" || g.category === category;
        const matchDiff = difficulty === "All" || g.difficulty === difficulty;
        return matchQ && matchCat && matchDiff;
      }),
    [query, category, difficulty],
  );
  return (
    <div className="container-app py-12 sm:py-16">
      <div className="rounded-[2rem] bg-heritage-forest px-6 py-10 text-white sm:px-10 lg:px-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
          <Gamepad2 className="h-4 w-4" /> GAME LIBRARY
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
          Explore Games
        </h1>
        <p className="mt-3 max-w-2xl text-white/70">
          Choose quizzes and interactive heritage games matched to the learner's
          age. Every activity includes educational feedback.
        </p>
      </div>
      <div className="sticky top-[76px] z-30 mt-6 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-soft backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search games or topics..."
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
            options={["All", "Medium", "Advanced", "Mixed"]}
            ariaLabel="Filter by difficulty"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> {filtered.length} matching
            games
          </span>
          <Badge tone="gold">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Quizzes + age-based
            word challenges
          </Badge>
        </div>
      </div>
      {filtered.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-extrabold">
            No games match those filters.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Try another search or category.
          </p>
        </div>
      )}
    </div>
  );
}
