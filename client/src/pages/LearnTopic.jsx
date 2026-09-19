import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Gamepad2,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { games, learningTopics } from "../data/content";
import { Badge, Button } from "../components/ui";

export default function LearnTopic() {
  const { slug } = useParams();
  const topic =
    learningTopics.find((t) => t.slug === slug) || learningTopics[0];
  const related = games.find((g) => g.chapterSlug === topic.slug) || games[0];
  return (
    <div className="container-app py-10 sm:py-14">
      <Link
        to="/learn"
        className="focus-ring inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 hover:text-heritage-green"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Learn
      </Link>
      <article className="mt-4 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
        <div className="relative h-[320px] sm:h-[420px]">
          <img
            src={topic.image}
            alt={`${topic.title} learning illustration`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-7 text-white sm:p-10">
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">{topic.era}</Badge>
              <Badge tone="orange">{topic.questionCount} questions</Badge>
            </div>
            <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
              {topic.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              {topic.description}
            </p>
          </div>
        </div>
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-extrabold text-heritage-green">
              <BookOpen className="h-5 w-5" /> What you'll learn
            </div>
            <div className="mt-5 grid gap-3">
              {topic.learn.map((p) => (
                <div
                  key={p}
                  className="flex items-start gap-3 rounded-2xl bg-heritage-cream p-4 text-sm font-semibold text-slate-700"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-heritage-green" />
                  {p}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-3xl border border-sky-100 bg-sky-50 p-6">
              <div className="flex items-center gap-2 font-extrabold text-sky-900">
                <Lightbulb className="h-5 w-5" /> Learning approach
              </div>
              <p className="mt-2 text-sm leading-6 text-sky-900/70">
                Heritage Quest uses medium and advanced questions focused on
                chronology, comparison, evidence, causation and historical
                context. Explanations appear after every answer so the quiz
                teaches rather than only scores.
              </p>
            </div>
          </div>
          <aside className="rounded-3xl bg-heritage-forest p-6 text-white">
            <Gamepad2 className="h-8 w-8 text-heritage-gold" />
            <h2 className="mt-4 text-xl font-extrabold">
              Ready for the chapter challenge?
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Answer {topic.questionCount} questions. Medium answers earn 20 XP;
              advanced answers earn 30 XP.
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl bg-white/10">
              <img
                src={related.image}
                alt="Related game"
                className="h-28 w-full object-cover"
              />
              <div className="p-4">
                <div className="font-extrabold">{related.title}</div>
                <div className="mt-1 text-xs text-white/60">
                  {related.description}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-100">
              <HelpCircle className="h-4 w-4" /> Medium + Advanced only
            </div>
            <Button
              as={Link}
              to={`/play/quiz/${topic.slug}`}
              className="mt-5 w-full"
            >
              Start Chapter <ArrowRight className="h-4 w-4" />
            </Button>
          </aside>
        </div>
      </article>
    </div>
  );
}
