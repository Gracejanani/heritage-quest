import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Gamepad2,
  BookOpen,
  Trophy,
  Gift,
  Landmark,
  Crown,
  Amphora,
  Drama,
  Map,
  Leaf,
  Users,
  Star,
  Zap,
  CalendarDays,
  Flame,
  Sparkles,
  Compass,
} from "lucide-react";
import { games, categories } from "../data/content";
import GameCard from "../components/GameCard";
import { Button, Modal, ProgressBar, useToast } from "../components/ui";
import { usePlayer } from "../context/PlayerContext";
import { supabase } from "../lib/supabase";

const featureItems = [
  {
    title: "Play Games",
    copy: "Fun & engaging challenges",
    icon: Gamepad2,
    cls: "bg-orange-100 text-orange-700",
  },
  {
    title: "Learn",
    copy: "Discover India’s rich heritage",
    icon: BookOpen,
    cls: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Compete",
    copy: "Climb the leaderboard",
    icon: Trophy,
    cls: "bg-amber-100 text-amber-700",
  },
  {
    title: "Earn Rewards",
    copy: "XP, coins, badges & more",
    icon: Gift,
    cls: "bg-sky-100 text-sky-700",
  },
];
const iconMap = {
  Landmark,
  Crown,
  Vase: Amphora,
  Drama,
  BookOpen,
  Map,
  Leaf,
  Users,
};

export default function Home() {
  const [videoOpen, setVideoOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { player, getSummary } = usePlayer();
  const summary = getSummary();
  const [todayStats, setTodayStats] = useState({
    answered: 0,
    correct: 0,
    loading: true,
  });

  const journeyDays = useMemo(() => {
    if (!player?.createdAt) return 1;
    const registered = new Date(player.createdAt);
    if (Number.isNaN(registered.getTime())) return 1;

    const registeredDay = new Date(
      registered.getFullYear(),
      registered.getMonth(),
      registered.getDate(),
    );
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    return Math.max(
      1,
      Math.floor((todayStart - registeredDay) / 86400000) + 1,
    );
  }, [player?.createdAt]);

  useEffect(() => {
    let active = true;

    if (!player?.id || !supabase) {
      setTodayStats({ answered: 0, correct: 0, loading: false });
      return () => {
        active = false;
      };
    }

    const loadTodayPerformance = async () => {
      const now = new Date();
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const { data, error } = await supabase
        .from("activity_log")
        .select("details, created_at")
        .eq("user_id", player.id)
        .eq("activity_type", "question_answered")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (!active) return;

      if (error) {
        console.error("Could not load today's challenge progress", error);
        setTodayStats({ answered: 0, correct: 0, loading: false });
        return;
      }

      const rows = data || [];
      setTodayStats({
        answered: rows.length,
        correct: rows.filter((row) => Boolean(row.details?.correct)).length,
        loading: false,
      });
    };

    loadTodayPerformance();

    return () => {
      active = false;
    };
  }, [player?.id]);

  const todayProgress = Math.min(
    100,
    Math.round((todayStats.answered / 5) * 100),
  );
  const todayAccuracy = todayStats.answered
    ? Math.round((todayStats.correct / todayStats.answered) * 100)
    : 0;
  const challengeComplete = todayStats.answered >= 5;
  const challengeSlug = summary.latestChapter || "ancient-india";
  const goCategory = (name) =>
    navigate(`/games?category=${encodeURIComponent(name)}`);
  return (
    <div>
      <section className="relative overflow-hidden bg-heritage-cream">
        <div className="absolute inset-0 pattern-dots opacity-35" />
        <div className="container-app relative grid min-h-[590px] items-center gap-10 py-12 lg:grid-cols-[.9fr_1.1fr] lg:py-16">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-4 py-2 text-xs font-extrabold tracking-[.18em] text-heritage-brown shadow-sm">
              <Sparkles className="h-4 w-4 text-heritage-saffron" /> GAMES FOR A
              GREATER TOMORROW
            </div>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[.95] tracking-tight text-heritage-brown sm:text-6xl lg:text-7xl">
              Discover India
              <br />
              <span className="text-heritage-green">Through Play!</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
              Fun games. Real stories. Our incredible heritage. Explore India’s
              history, culture, monuments and civilizations through interactive
              learning adventures.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/games" size="lg">
                Start Exploring <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVideoOpen(true)}
              >
                <Play className="h-5 w-5 fill-heritage-forest" /> Watch
                Introduction
              </Button>
            </div>
            <div className="mt-9 grid max-w-2xl grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-5">
              {[
                ["14", "Learning Modules"],
                ["120", "Quiz Questions"],
                ["28", "States"],
                ["50+", "Game Ideas"],
                ["1", "Incredible India"],
              ].map(([n, l]) => (
                <div
                  key={l}
                  className="border-l-2 border-heritage-gold/60 pl-4"
                >
                  <div className="text-2xl font-extrabold text-heritage-forest">
                    {n}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-0 min-h-[390px] lg:min-h-[500px]">
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] shadow-card">
              <img
                src="/assets/hero-heritage.jpg"
                alt="Illustrated Indian heritage scene with monuments and a young explorer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-heritage-cream/55 via-transparent to-transparent lg:from-transparent" />
            </div>
            <div className="float-slow absolute right-5 top-5 max-w-[210px] rounded-3xl border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur-md">
              <p className="font-display text-xl font-bold italic leading-tight text-heritage-brown">
                “Our History
                <br />
                Our Heritage
                <br />
                Our Future”
              </p>
            </div>
            <div className="absolute bottom-5 left-5 rounded-2xl bg-heritage-forest/92 px-4 py-3 text-white shadow-soft backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <Compass className="h-4 w-4" /> Today’s trail
              </div>
              <div className="mt-1 text-xs text-white/70">
                Chola Dynasty · 10 questions
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container-app relative z-20 -mt-5">
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card sm:grid-cols-2 lg:grid-cols-4">
          {featureItems.map(({ title, copy, icon: Icon, cls }, i) => (
            <div
              key={title}
              className={`flex items-center gap-4 p-5 ${i ? "border-t sm:border-l sm:border-t-0" : ""} border-slate-100`}
            >
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${cls}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950">{title}</h3>
                <p className="mt-1 text-xs text-slate-500">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="container-app py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Popular Games</h2>
            <p className="section-copy !mt-2">
              Evidence-based history challenges with explanations after every
              answer.
            </p>
          </div>
          <Link
            to="/games"
            className="focus-ring hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-heritage-green hover:bg-emerald-50 sm:inline-flex"
          >
            View All Games <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {games.slice(0, 5).map((g) => (
            <GameCard key={g.id} game={g} compact />
          ))}
        </div>
      </section>
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="container-app">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Explore by Category</h2>
              <p className="section-copy">
                Choose a topic and discover connected games and learning paths.
              </p>
            </div>
            <div className="rounded-2xl bg-heritage-cream px-4 py-3 text-sm font-bold text-heritage-brown">
              <Star className="mr-2 inline h-4 w-4 text-heritage-gold" /> 8
              heritage pathways
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
            {categories.map((c) => {
              const Icon = iconMap[c.icon] || Star;
              return (
                <button
                  key={c.name}
                  onClick={() => goCategory(c.name)}
                  className={`focus-ring group rounded-3xl p-5 text-left transition hover:-translate-y-1 hover:shadow-soft ${c.tint}`}
                >
                  <Icon className="h-8 w-8 transition group-hover:scale-110" />
                  <div className="mt-5 text-sm font-extrabold leading-tight">
                    {c.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      <section className="container-app py-16">
        <div className="grid overflow-hidden rounded-[2rem] bg-heritage-forest text-white shadow-card lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-8 sm:p-12 lg:p-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
              <BookOpen className="h-4 w-4" /> FEATURED LEARNING
            </div>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Learn India. Understand India.
              <br />
              <span className="text-heritage-gold">
                Preserve India’s Heritage.
              </span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Discover people, places, events and traditions through 12 quiz
              chapters, 2 additional study materials and 120 mixed normal-and-advanced questions.
            </p>
            <Button as={Link} to="/learn" className="mt-7" size="lg">
              Start Learning <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative min-h-[340px]">
            <img
              src="/assets/hero-heritage.jpg"
              alt="Indian monuments and heritage landscape"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-heritage-forest via-heritage-forest/25 to-transparent" />
            <div className="absolute bottom-6 right-6 rounded-3xl bg-white/90 p-5 text-slate-900 shadow-card backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-extrabold text-heritage-forest">
                <Zap className="h-4 w-4 text-heritage-saffron" /> Learning
                streak
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-extrabold">
                  {journeyDays}
                </span>
                <span className="pb-1 text-sm text-slate-500">
                  {journeyDays === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container-app pb-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold tracking-[.16em] text-heritage-saffron">
                  DAILY CHALLENGE
                </p>
                <h3 className="mt-2 text-2xl font-extrabold">
                  Today’s Heritage Challenge
                </h3>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-heritage-saffron">
                <CalendarDays />
              </div>
            </div>
            <p className="mt-3 text-slate-600">
              Complete five questions today. Your progress updates from your
              real quiz activity in Supabase.
            </p>
            <ProgressBar
              value={todayProgress}
              label={
                todayStats.loading
                  ? "Loading today’s progress…"
                  : `Today’s progress · ${Math.min(todayStats.answered, 5)}/5 answered`
              }
              className="mt-6"
            />
            {!todayStats.loading && (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {todayStats.answered > 0
                  ? `${todayStats.correct} correct · ${todayAccuracy}% accuracy today`
                  : "No questions answered yet today."}
              </p>
            )}
            <Button
              as={Link}
              to={
                challengeComplete
                  ? "/learn"
                  : `/play/quiz/${challengeSlug}`
              }
              variant="secondary"
              className="mt-6"
            >
              {challengeComplete ? "Challenge completed" : "Continue challenge"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-3xl bg-orange-50 p-6 ring-1 ring-orange-100">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-heritage-saffron shadow-sm">
              <Flame />
            </div>
            <h3 className="mt-5 text-xl font-extrabold">Build your streak</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Learn or play for 10 minutes a day. Reach seven days to unlock the
              Streak Star badge.
            </p>
            <button
              onClick={() =>
                toast("Daily reminder preference saved for this demo.")
              }
              className="focus-ring mt-5 text-sm font-extrabold text-heritage-saffron"
            >
              Set daily reminder →
            </button>
          </div>
        </div>
      </section>
      <Modal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        title="Welcome to Heritage Quest"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
          <div className="aspect-video w-full bg-black">
            <video
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
            >
              <source
                src="/videos/heritage-quest-intro.mp4"
                type="video/mp4"
              />
              Your browser does not support video playback.
            </video>
          </div>
        </div>
        <p className="mt-4 text-center text-sm leading-6 text-slate-500">
          See how to explore, learn and play with Heritage Quest.
        </p>
      </Modal>
    </div>
  );
}
