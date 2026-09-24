import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Gamepad2,
  Medal,
  Trophy,
  UsersRound,
  HelpCircle,
} from "lucide-react";
import { useLiveGames } from "../lib/liveContent";
import { Badge, Button } from "../components/ui";

export default function GameDetails() {
  const games = useLiveGames();
  const { slug } = useParams();
  const game = games.find((g) => g.slug === slug) || games[0];
  const playPath = game.playPath || `/play/quiz/${game.chapterSlug}`;
  const questionCount = Number(game.questionCount || 10);

  return (
    <div className="container-app py-10 sm:py-14">
      <Link
        to="/games"
        className="focus-ring inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 hover:text-heritage-green"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>
      <section className="mt-4 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card lg:grid-cols-2">
        <div className="relative min-h-[350px] lg:min-h-[550px]">
          <img
            src={game.image}
            alt={`${game.title} artwork`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <Badge tone="orange">Heritage challenge</Badge>
            <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
              {game.title}
            </h1>
          </div>
        </div>
        <div className="p-7 sm:p-10 lg:p-12">
          <div className="flex flex-wrap gap-2">
            <Badge>{game.category}</Badge>
            <Badge tone={game.difficulty === "Advanced" ? "red" : "gold"}>
              {game.difficulty}
            </Badge>
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" /> {game.gameType === "word" ? "Word Builder / Learning" : "Quiz / Learning"}
            </span>
            <span className="inline-flex items-center gap-2">
              <UsersRound className="h-4 w-4" /> {game.players}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" /> {game.time}
            </span>
            <span className="inline-flex items-center gap-2">
              <HelpCircle className="h-4 w-4" /> {questionCount} {game.gameType === "word" ? "word puzzles" : "questions"}
            </span>
          </div>
          <p className="mt-7 text-lg leading-8 text-slate-600">
            {game.longDescription}
          </p>
          <div className="mt-8">
            <h2 className="text-xl font-extrabold">What You’ll Learn</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {game.learn.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-3xl bg-heritage-cream p-5">
            <div className="flex items-center gap-2 font-extrabold text-heritage-brown">
              <Trophy className="h-5 w-5 text-heritage-gold" /> Achievements
              available
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {game.achievements.map((a) => (
                <Badge key={a} tone="gold">
                  <Medal className="mr-1 inline h-3.5 w-3.5" />
                  {a}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to={playPath} size="lg">
              Play Now <ArrowRight className="h-5 w-5" />
            </Button>
            {game.chapterSlug && (
              <Button
                as={Link}
                to={`/learn/${game.chapterSlug}`}
                variant="outline"
                size="lg"
              >
                <BookOpen className="h-5 w-5" /> Learn First
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
