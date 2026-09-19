import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, UsersRound, Play, HelpCircle } from "lucide-react";
import { Badge } from "./ui";

export default function GameCard({ game, compact = false }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link to={`/games/${game.slug}`} className="block overflow-hidden">
        <img
          src={game.image}
          alt={`${game.title} game artwork`}
          className={`w-full object-cover transition duration-500 group-hover:scale-105 ${compact ? "h-36" : "h-48"}`}
        />
      </Link>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>{game.category}</Badge>
          <Badge tone={game.difficulty === "Advanced" ? "red" : "gold"}>
            {game.difficulty}
          </Badge>
        </div>
        <Link to={`/games/${game.slug}`}>
          <h3 className="mt-3 text-lg font-extrabold text-slate-950 transition group-hover:text-heritage-green">
            {game.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-slate-500">{game.description}</p>
        {!compact && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <UsersRound className="h-4 w-4" />
              {game.players}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-4 w-4" />
              {game.time}
            </span>
            <span className="inline-flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              10 questions
            </span>
          </div>
        )}
        <div className="mt-5 flex items-center justify-between">
          <Link
            to={`/play/quiz/${game.chapterSlug}`}
            className="focus-ring inline-flex items-center gap-2 rounded-xl text-sm font-extrabold text-heritage-green hover:text-emerald-800"
          >
            Play <Play className="h-4 w-4 fill-current" />
          </Link>
          <Link
            to={`/games/${game.slug}`}
            className="focus-ring rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={`View ${game.title}`}
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
