import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Check,
  Clock3,
  Eye,
  Lightbulb,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Button, Modal, ProgressBar, useToast } from "../components/ui";
import { api, saveLocalProgress } from "../lib/api";

const solved = Array.from({ length: 9 }, (_, i) => i);
function shuffled() {
  const a = [...solved];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.every((v, i) => v === i) ? [...a.slice(1), a[0]] : a;
}

export default function PuzzleGame() {
  const [tiles, setTiles] = useState(shuffled);
  const [drag, setDrag] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [moves, setMoves] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [complete, setComplete] = useState(false);
  const toast = useToast();
  const correctCount = useMemo(
    () => tiles.filter((v, i) => v === i).length,
    [tiles],
  );

  useEffect(() => {
    if (complete) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [complete]);
  useEffect(() => {
    saveLocalProgress("puzzle", { tiles, seconds, moves, complete });
  }, [tiles, seconds, moves, complete]);

  const swap = (target) => {
    if (drag === null || drag === target) return;
    setTiles((prev) => {
      const next = [...prev];
      [next[drag], next[target]] = [next[target], next[drag]];
      return next;
    });
    setMoves((m) => m + 1);
    setDrag(null);
  };
  const check = async () => {
    if (tiles.every((v, i) => v === i)) {
      setComplete(true);
      confetti({ particleCount: 180, spread: 95, origin: { y: 0.7 } });
      try {
        await api("/progress", {
          method: "POST",
          body: JSON.stringify({
            gameId: "monument-puzzle",
            level: 1,
            score: Math.max(100, 1000 - moves * 10 - seconds),
            coins: 75,
            xp: 250,
          }),
        });
      } catch {}
    } else
      toast(
        `${correctCount}/9 pieces are in the correct place. Keep going!`,
        "error",
      );
  };
  const reset = () => {
    setTiles(shuffled());
    setSeconds(0);
    setMoves(0);
    setComplete(false);
  };
  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-[80vh] bg-heritage-cream py-8 sm:py-12">
      <div className="container-app max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/games/chola-empire-builder"
            className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold shadow-sm">
              <Clock3 className="h-4 w-4 text-heritage-green" /> {fmt}
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-sm font-bold shadow-sm">
              {moves} moves
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card sm:p-8">
            <div className="text-center">
              <div className="text-xs font-extrabold tracking-[.15em] text-heritage-saffron">
                MONUMENT PUZZLE
              </div>
              <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
                Arrange the pieces to complete the monument!
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Drag one tile onto another to swap their positions.
              </p>
            </div>
            <div className="mx-auto mt-7 grid aspect-square w-full max-w-[590px] grid-cols-3 overflow-hidden rounded-3xl border-4 border-heritage-sand bg-slate-100 shadow-inner">
              {tiles.map((tile, pos) => {
                const x = (tile % 3) * 50;
                const y = Math.floor(tile / 3) * 50;
                const good = tile === pos;
                return (
                  <button
                    key={`${pos}-${tile}`}
                    draggable
                    onDragStart={() => setDrag(pos)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => swap(pos)}
                    className={`focus-ring relative border border-white/70 bg-cover bg-no-repeat transition ${good ? "ring-2 ring-inset ring-emerald-400" : ""}`}
                    style={{
                      backgroundImage: "url('/assets/games/monument-mania.webp')",
                      backgroundSize: "300% 300%",
                      backgroundPosition: `${x}% ${y}%`,
                    }}
                    aria-label={`Puzzle tile ${pos + 1}`}
                  >
                    {good && (
                      <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white shadow">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <ProgressBar
              value={Math.round((correctCount / 9) * 100)}
              label={`${correctCount} of 9 pieces correctly placed`}
              className="mx-auto mt-6 max-w-[590px]"
            />
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-heritage-forest p-6 text-white shadow-card">
              <Trophy className="h-8 w-8 text-heritage-gold" />
              <h2 className="mt-4 text-xl font-extrabold">Puzzle Score</h2>
              <div className="mt-4 text-4xl font-extrabold">
                {Math.max(100, 1000 - moves * 10 - seconds)}
              </div>
              <p className="mt-1 text-sm text-white/60">
                Fewer moves + faster time = higher score.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-extrabold">Need a clue?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Preview the completed monument, then return and place the pieces
                from memory.
              </p>
              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={() => setShowHint(true)}
              >
                <Eye className="h-4 w-4" /> Preview monument
              </Button>
            </div>
            <div className="grid gap-3">
              <Button onClick={check} size="lg">
                Check Answer <Check className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Shuffle again
              </Button>
            </div>
          </aside>
        </div>
      </div>
      <Modal
        open={showHint}
        onClose={() => setShowHint(false)}
        title="Puzzle Hint"
      >
        <img
          src="/assets/games/monument-mania.webp"
          alt="Completed Taj Mahal puzzle reference"
          className="w-full rounded-2xl object-cover"
        />
        <p className="mt-4 text-sm text-slate-600">
          <Lightbulb className="mr-2 inline h-4 w-4 text-heritage-gold" />
          Look at the dome, minarets and horizon line to identify neighboring
          pieces.
        </p>
      </Modal>
      <Modal
        open={complete}
        onClose={() => setComplete(false)}
        title="🎉 Great Job!"
      >
        <div className="text-center">
          <div className="badge-pop mx-auto grid h-24 w-24 place-items-center rounded-full bg-amber-100">
            <Trophy className="h-12 w-12 text-amber-600" />
          </div>
          <p className="mt-5 text-lg font-extrabold">
            Monument completed in {fmt} with {moves} moves.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            You earned 250 XP and a puzzle progress update.
          </p>
          <Button as={Link} to="/achievements" className="mt-6">
            View Achievements
          </Button>
        </div>
      </Modal>
    </div>
  );
}
