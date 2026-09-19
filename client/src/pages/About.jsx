import React from "react";
import {
  BookOpen,
  Gamepad2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function About() {
  const cards = [
    [
      BookOpen,
      "Learn",
      "Make Indian history and heritage easier to understand through visual, contextual explanations.",
    ],
    [
      Gamepad2,
      "Play",
      "Turn knowledge into meaningful medium-and-advanced challenges with instant educational feedback.",
    ],
    [
      HeartHandshake,
      "Preserve",
      "Help younger generations connect with India’s diverse heritage in a respectful, modern format.",
    ],
  ];
  return (
    <div>
      <section className="bg-heritage-cream py-16 sm:py-20">
        <div className="container-app grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-extrabold text-orange-800">
              <Sparkles className="h-4 w-4" /> ABOUT HERITAGE QUEST
            </div>
            <h1 className="mt-5 font-display text-5xl font-extrabold text-heritage-brown sm:text-6xl">
              Our Mission
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Heritage Quest transforms Indian history, civilization and culture
              into interactive learning experiences through games, quizzes,
              puzzles and exploration.
            </p>
            <div className="mt-6 rounded-2xl bg-white p-4 text-sm font-bold text-heritage-green shadow-sm">
              12 chapters • 120 medium & advanced questions • no login required
            </div>
          </div>
          <img
            src="/assets/hero-heritage.jpg"
            alt="Indian heritage illustration"
            className="h-[360px] w-full rounded-[2rem] object-cover shadow-card"
          />
        </div>
      </section>
      <section className="container-app py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map(([Icon, title, copy]) => (
            <article
              key={title}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-heritage-green">
                <Icon className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-[2rem] bg-heritage-forest p-8 text-white sm:p-10">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-6 w-6 text-heritage-gold" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-extrabold">
                Inspired by the Smart India Hackathon 2026 problem-statement
                concept
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                This independent prototype responds to the concept
                “Conceptualize and develop unique toys and games based on Indian
                civilization, history, and culture.” It does not claim official
                SIH endorsement or affiliation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
