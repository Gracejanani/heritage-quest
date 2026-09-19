import React, { useState } from "react";
import { ArrowRight, Compass, UserRound } from "lucide-react";
import Logo from "./Logo";
import { usePlayer } from "../context/PlayerContext";

export default function PlayerGate({ children }) {
  const { player, knownProfiles, startPlayer } = usePlayer();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  if (player) return children;

  const enter = (rawName) => {
    const result = startPlayer(rawName);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
  };

  const submit = (event) => {
    event.preventDefault();
    enter(name);
  };

  return (
    <main className="min-h-screen bg-heritage-cream">
      <div className="container-app grid min-h-screen items-center gap-8 py-10 lg:grid-cols-[.95fr_1.05fr]">
        <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-orange-100 bg-white p-7 shadow-card sm:p-10">
          <Logo />
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold tracking-[.14em] text-heritage-green">
            <Compass className="h-4 w-4" /> YOUR JOURNEY, YOUR PROGRESS
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-heritage-brown sm:text-5xl">
            Welcome to Heritage Quest
          </h1>
          <p className="mt-4 max-w-lg leading-7 text-slate-600">
            Enter your name to begin. If you return with the same name on this
            browser, your unfinished quests, scores and progress will continue
            from where you left them.
          </p>

          <form onSubmit={submit} className="mt-8">
            <label htmlFor="explorer-name" className="text-sm font-extrabold text-slate-800">
              What is your name?
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
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
              <button
                type="submit"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-heritage-green px-6 font-extrabold text-white transition hover:bg-emerald-700"
              >
                Enter Quest <ArrowRight className="h-4 w-4" />
              </button>
            </div>
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
                    onClick={() => enter(profile.name)}
                    className="focus-ring rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-heritage-green hover:bg-emerald-100"
                  >
                    Continue as {profile.name}
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
              Grace can pause a chapter, Sham can start fresh, and each explorer
              keeps their own progress on this browser.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
