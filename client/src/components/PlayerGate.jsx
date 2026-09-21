import React, { useState } from "react";
import { ArrowRight, CalendarDays, Compass, UserRound } from "lucide-react";
import Logo from "./Logo";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";

export default function PlayerGate({ children }) {
  const { player, knownProfiles, startPlayer } = usePlayer();
  const { language, setLanguage, languages, t } = useLanguage();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");

  if (player) return children;

  const enter = (rawName, rawDob) => {
    const result = startPlayer(rawName, rawDob);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
  };

  const submit = (event) => {
    event.preventDefault();
    enter(name, dob);
  };

  return (
    <main className="min-h-screen bg-heritage-cream">
      <div className="container-app grid min-h-screen items-center gap-8 py-10 lg:grid-cols-[.95fr_1.05fr]">
        <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-orange-100 bg-white p-7 shadow-card sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={t("language")}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold tracking-[.14em] text-heritage-green">
            <Compass className="h-4 w-4" /> YOUR JOURNEY, YOUR PROGRESS
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-heritage-brown sm:text-5xl">
            Welcome to Heritage Quest
          </h1>
          <p className="mt-4 max-w-lg leading-7 text-slate-600">
            Enter your name and date of birth to begin. Together they identify
            your prototype profile on this browser, so your unfinished quests,
            scores and progress stay separate from other students.
          </p>

          <form onSubmit={submit} className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="explorer-name" className="text-sm font-extrabold text-slate-800">
                  Your name
                </label>
                <div className="relative mt-2 min-w-0">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="explorer-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    autoComplete="name"
                    autoFocus
                    maxLength={40}
                    placeholder="e.g. Grace Kumar"
                    className="focus-ring h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="explorer-dob" className="text-sm font-extrabold text-slate-800">
                  Date of birth
                </label>
                <div className="relative mt-2 min-w-0">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="explorer-dob"
                    type="date"
                    value={dob}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => {
                      setDob(e.target.value);
                      setError("");
                    }}
                    className="focus-ring h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-base font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="focus-ring mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-heritage-green px-6 font-extrabold text-white transition hover:bg-emerald-700"
            >
              Enter Quest <ArrowRight className="h-4 w-4" />
            </button>
            {error && (
              <p className="mt-3 text-sm font-semibold text-rose-600" role="alert">
                {error}
              </p>
            )}
          </form>

          {knownProfiles.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-400">
                Recent explorers on this browser
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {knownProfiles.slice(0, 5).map((profile) => (
                  <button
                    type="button"
                    key={profile.id}
                    onClick={() => enter(profile.name, profile.dob)}
                    className="focus-ring rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-heritage-green hover:bg-emerald-100"
                  >
                    Continue as {profile.name} · {profile.dob}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="relative hidden min-h-[560px] overflow-hidden rounded-[2.5rem] lg:block">
          <img
            src="/assets/hero-heritage.jpg"
            alt="Illustrated Indian heritage landscape"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-heritage-forest/90 via-heritage-forest/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
            <p className="font-display text-4xl font-extrabold">
              Every explorer gets a separate journey.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">
              Name + date of birth keeps each prototype profile distinct, even
              when two students have the same name.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
