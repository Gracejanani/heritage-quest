import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Coins,
  Eraser,
  Lightbulb,
  PlayCircle,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trophy,
  Undo2,
  Video,
  XCircle,
} from "lucide-react";
import { Button, Badge, ProgressBar, useToast } from "../components/ui";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";
import { AGE_GROUPS } from "../lib/age";
import { issueCertificate } from "../lib/certificates";
import { supabase } from "../lib/supabase";
import { useLiveGames } from "../lib/liveContent";

const GAME_SLUG = "heritage-word-quest";

function countSlots(pattern = "") {
  return [...String(pattern)].filter((char) => char === "_").length;
}

function fillPattern(pattern = "", selectedLetters = []) {
  let letterIndex = 0;
  return [...String(pattern)].map((char, index) => {
    if (char !== "_") {
      return (
        <span
          key={`separator-${index}`}
          className="w-4 text-center text-slate-300"
        >
          {char}
        </span>
      );
    }

    const letter = selectedLetters[letterIndex] || "";
    letterIndex += 1;

    return (
      <span
        key={`slot-${index}`}
        className={`grid h-12 w-10 place-items-center rounded-xl border-2 text-xl font-black transition sm:h-14 sm:w-12 sm:text-2xl ${
          letter
            ? "border-sky-400 bg-sky-50 text-sky-900"
            : "border-slate-200 bg-white text-slate-300"
        }`}
      >
        {letter || "•"}
      </span>
    );
  });
}

function PreGameVideo({ game, onSkip, onStart, onEnded, videoFinished }) {
  const videoUrl = game?.testVideo || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-blue-950 to-slate-950 py-8">
      <div className="container-app max-w-5xl">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="relative border-b border-sky-100 p-6 sm:p-8">
            <div className="pr-0 sm:pr-44">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-sky-700">
                <Video className="h-4 w-4" /> Before the game
              </div>
              <h1 className="mt-4 font-display text-3xl font-extrabold text-slate-950 sm:text-4xl">
                Learn first, then build the word
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Watch the short lesson if your teacher has added one. It can help
                you understand the heritage clues before the word challenge starts.
              </p>
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-600 shadow-sm hover:border-sky-400 hover:text-sky-700 sm:absolute sm:right-8 sm:top-8 sm:mt-0"
            >
              Skip & go to game <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {videoUrl ? (
              <div className="overflow-hidden rounded-[1.5rem] bg-black shadow-lg">
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  onEnded={onEnded}
                  className="aspect-video w-full bg-black object-contain"
                >
                  Your browser does not support this video.
                </video>
              </div>
            ) : (
              <div className="grid aspect-video place-items-center rounded-[1.5rem] border-2 border-dashed border-sky-200 bg-sky-50/70 p-8 text-center">
                <div>
                  <PlayCircle className="mx-auto h-14 w-14 text-sky-300" />
                  <h2 className="mt-4 text-xl font-extrabold text-slate-800">
                    Video lesson can be added later
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    The administrator can upload a video for Heritage Word Quest
                    from the game editor. For now, continue directly to the game.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl bg-sky-50 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="font-extrabold text-slate-900">
                  {videoFinished
                    ? "Video completed — ready to play."
                    : videoUrl
                      ? "Watch the lesson or continue when ready."
                      : "No video has been added yet."}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  The game will automatically use the student’s registered age group.
                </div>
              </div>
              <Button onClick={onStart} className="bg-sky-600 hover:bg-sky-700">
                Start word game <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WordQuestGame() {
  const toast = useToast();
  const games = useLiveGames();
  const game = games.find((item) => item.slug === GAME_SLUG);
  const {
    player,
    saveProgress,
    getProgress,
    progressReady,
    logActivity,
  } = usePlayer();
  const { language, translateText } = useLanguage();

  const ageGroup = player?.ageGroup || "scholar";
  const ageInfo = AGE_GROUPS[ageGroup] || AGE_GROUPS.scholar;

  const [puzzles, setPuzzles] = useState([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState([]);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(50);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [videoFinished, setVideoFinished] = useState(false);
  const [translatedClue, setTranslatedClue] = useState("");
  const [translatedHint, setTranslatedHint] = useState("");

  const puzzle = puzzles[index];
  const selectedLetters = useMemo(
    () => chosen.map((tileIndex) => puzzle?.letters?.[tileIndex] || ""),
    [chosen, puzzle],
  );
  const selectedWord = selectedLetters.join("");
  const requiredLetters = countSlots(puzzle?.answer_pattern);
  const progress = puzzles.length
    ? Math.round(((index + (result ? 1 : 0)) / puzzles.length) * 100)
    : 0;
  const correctCount = answers.filter((item) => item.correct).length;

  useEffect(() => {
    if (!progressReady || !player?.id || !supabase) return;

    let active = true;
    setLoading(true);
    setError("");

    const saved = getProgress(`quiz:${GAME_SLUG}`, null);

    supabase
      .rpc("get_word_puzzles", {
        p_game_slug: GAME_SLUG,
        p_age_group: ageGroup,
      })
      .then(({ data, error: rpcError }) => {
        if (!active) return;
        if (rpcError) throw rpcError;

        const rows = (data || []).map((row) => ({
          ...row,
          letters: Array.isArray(row.letters) ? row.letters : [],
        }));

        setPuzzles(rows);

        if (saved && !saved.finished) {
          setIndex(Math.min(Number(saved.index || 0), Math.max(0, rows.length - 1)));
          setAnswers(Array.isArray(saved.answers) ? saved.answers : []);
          setXp(Number(saved.xp || 0));
          setCoins(Number(saved.coins ?? 50));
        } else if (saved?.finished) {
          setAnswers(Array.isArray(saved.answers) ? saved.answers : []);
          setXp(Number(saved.xp || 0));
          setCoins(Number(saved.coins ?? 50));
          setFinished(true);
          setShowVideo(false);
        }
      })
      .catch((loadError) => {
        console.error(loadError);
        if (active) {
          setError(
            loadError?.message ||
              "Could not load Heritage Word Quest. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ageGroup, getProgress, player?.id, progressReady]);

  useEffect(() => {
    if (!progressReady || !player?.id || !puzzles.length) return;

    saveProgress(`quiz:${GAME_SLUG}`, {
      index,
      score: answers.filter((item) => item.correct).length * 100,
      xp,
      coins,
      finished,
      answers,
    });
  }, [
    answers,
    coins,
    finished,
    index,
    player?.id,
    progressReady,
    puzzles.length,
    saveProgress,
    xp,
  ]);

  useEffect(() => {
    let active = true;

    if (!puzzle || language === "en") {
      setTranslatedClue("");
      setTranslatedHint("");
      return () => {
        active = false;
      };
    }

    Promise.all([
      translateText(puzzle.clue, language),
      translateText(puzzle.hint || "", language),
    ]).then(([clue, hint]) => {
      if (!active) return;
      setTranslatedClue(clue);
      setTranslatedHint(hint);
    });

    const nextPuzzle = puzzles[index + 1];
    if (nextPuzzle) {
      translateText(nextPuzzle.clue, language).catch(() => {});
      translateText(nextPuzzle.hint || "", language).catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [index, language, puzzle?.id, puzzles, translateText]);

  const chooseLetter = (tileIndex) => {
    if (result || chosen.includes(tileIndex)) return;
    if (chosen.length >= requiredLetters) return;
    setChosen((current) => [...current, tileIndex]);
  };

  const undo = () => {
    if (result) return;
    setChosen((current) => current.slice(0, -1));
  };

  const clear = () => {
    if (result) return;
    setChosen([]);
  };

  const checkWord = async () => {
    if (!puzzle || !supabase || result) return;
    if (selectedWord.length !== requiredLetters) {
      toast("Select all the letters before checking the word.", "error");
      return;
    }

    const { data, error: checkError } = await supabase.rpc(
      "check_word_puzzle_answer",
      {
        p_game_slug: GAME_SLUG,
        p_puzzle_id: puzzle.id,
        p_age_group: ageGroup,
        p_selected_answer: selectedWord,
      },
    );

    if (checkError) {
      toast(checkError.message || "Could not check the word.", "error");
      return;
    }

    const checked = Array.isArray(data) ? data[0] : data;
    if (!checked) return;

    setResult(checked);

    const gainedXp = Number(checked.xp || 0);
    if (checked.correct) {
      setXp((value) => value + gainedXp);
      setCoins((value) => value + 10);
      confetti({ particleCount: 55, spread: 55, origin: { y: 0.72 } });
    }

    setAnswers((current) => [
      ...current,
      {
        id: puzzle.id,
        clue: puzzle.clue,
        selectedAnswer: selectedWord,
        correctAnswer: checked.correct_answer,
        correct: Boolean(checked.correct),
        difficulty: checked.difficulty,
      },
    ]);

    logActivity("word_puzzle_answered", {
      chapterSlug: GAME_SLUG,
      gameSlug: GAME_SLUG,
      puzzleId: puzzle.id,
      correct: Boolean(checked.correct),
      ageGroup,
      xpEarned: gainedXp,
    });
  };

  const completeGame = async () => {
    const finalAnswers = answers;
    const totalCorrect = finalAnswers.filter((item) => item.correct).length;
    const finalXp = xp + 100 + (totalCorrect === puzzles.length ? 100 : 0);
    const finalCoins = coins + 75;

    setXp(finalXp);
    setCoins(finalCoins);
    setFinished(true);

    logActivity("word_game_completed", {
      chapterSlug: GAME_SLUG,
      gameSlug: GAME_SLUG,
      taskName: "Heritage Word Quest",
      correctAnswers: totalCorrect,
      totalQuestions: puzzles.length,
      ageGroup,
      xp: finalXp,
      coins: finalCoins,
    });

    issueCertificate({
      userId: player?.id,
      chapterSlug: GAME_SLUG,
      taskName: "Heritage Word Quest",
      correctAnswers: totalCorrect,
      totalQuestions: puzzles.length,
    }).catch((certificateError) => {
      console.error("Could not issue Word Quest certificate", certificateError);
    });

    confetti({ particleCount: 150, spread: 90, origin: { y: 0.65 } });
  };

  const next = () => {
    if (!result) return;

    if (index < puzzles.length - 1) {
      setIndex((value) => value + 1);
      setChosen([]);
      setResult(null);
      setShowHint(false);
      return;
    }

    completeGame();
  };

  const reset = () => {
    setIndex(0);
    setChosen([]);
    setResult(null);
    setAnswers([]);
    setXp(0);
    setCoins(50);
    setFinished(false);
    setShowHint(false);
    setShowVideo(true);
    setVideoFinished(false);
  };

  const enterGame = (mode) => {
    setShowVideo(false);
    logActivity(
      mode === "skip"
        ? "word_game_video_skipped"
        : "word_game_video_completed",
      {
        chapterSlug: GAME_SLUG,
        gameSlug: GAME_SLUG,
        videoUrl: game?.testVideo || null,
        ageGroup,
      },
    );
  };

  if (showVideo && !finished) {
    return (
      <PreGameVideo
        game={game}
        onSkip={() => enterGame("skip")}
        onStart={() => enterGame(videoFinished ? "watched" : "start")}
        onEnded={() => setVideoFinished(true)}
        videoFinished={videoFinished}
      />
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-[80vh] place-items-center bg-sky-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-sky-300" />
          <p className="mt-4 font-bold">Preparing your age-level word quest…</p>
        </div>
      </div>
    );
  }

  if (error || !puzzles.length) {
    return (
      <div className="container-app grid min-h-[70vh] place-items-center py-12">
        <div className="max-w-xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-card">
          <XCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h1 className="mt-4 text-2xl font-extrabold">Word Quest unavailable</h1>
          <p className="mt-3 text-slate-600">
            {error || "No age-appropriate word puzzles were found."}
          </p>
          <Button as={Link} to="/games" className="mt-6">
            Back to Games
          </Button>
        </div>
      </div>
    );
  }

  if (finished) {
    const totalCorrect = answers.filter((item) => item.correct).length;
    const accuracy = Math.round((totalCorrect / puzzles.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 py-12">
        <div className="container-app grid min-h-[72vh] place-items-center">
          <div className="w-full max-w-2xl rounded-[2rem] border border-sky-200 bg-white p-8 text-center shadow-2xl sm:p-12">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-sky-100 text-sky-700">
              <Trophy className="h-12 w-12" />
            </div>
            <h1 className="mt-6 font-display text-4xl font-extrabold text-slate-950">
              Heritage Word Quest complete!
            </h1>
            <p className="mt-3 text-slate-600">
              Great work, <strong>{player?.name}</strong>. You completed the{" "}
              <strong>{ageInfo.label}</strong> word set.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultStat n={`${totalCorrect}/${puzzles.length}`} l="Correct" />
              <ResultStat n={`${accuracy}%`} l="Accuracy" />
              <ResultStat n={`+${xp}`} l="XP" />
              <ResultStat n={coins} l="Coins" />
            </div>

            <div className="mt-6 rounded-2xl bg-sky-50 p-4 text-sm font-bold text-sky-900">
              <Sparkles className="mr-2 inline h-4 w-4" />
              Your certificate uses a special light-blue and white Word Quest design.
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={reset} variant="outline">
                <RotateCcw className="h-4 w-4" /> Play Again
              </Button>
              <Button
                as={Link}
                to={`/certificate/${GAME_SLUG}`}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <Award className="h-4 w-4" /> View Certificate
              </Button>
              <Button as={Link} to="/games" variant="secondary">
                More Games <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const clue = translatedClue || puzzle.clue;
  const hint = translatedHint || puzzle.hint;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-blue-950 to-slate-950 py-6 sm:py-10">
      <div className="container-app max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 text-white">
          <Link
            to="/games"
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </Link>

          <div className="text-center">
            <div className="text-xs font-bold text-sky-200/70">
              {player?.name} · {ageInfo.label} · {ageInfo.range}
            </div>
            <div className="text-sm font-extrabold">
              Word {index + 1} of {puzzles.length}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
              {xp} XP
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
              <Coins className="h-4 w-4 text-yellow-300" /> {coins}
            </span>
          </div>
        </div>

        <ProgressBar
          value={progress}
          className="mt-5 [&>div]:bg-white/15 [&>div>div]:bg-sky-300"
        />

        <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="h-2 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone={puzzle.difficulty === "Advanced" ? "red" : "blue"}>
                {puzzle.difficulty}
              </Badge>
              <span className="text-xs font-bold text-slate-400">
                Tap the letters in the correct order
              </span>
            </div>

            <div className="mt-6 rounded-3xl bg-sky-50 p-5 text-center sm:p-7">
              <div className="text-xs font-extrabold uppercase tracking-[.16em] text-sky-700">
                Heritage clue
              </div>
              <h1 className="mx-auto mt-3 max-w-3xl text-xl font-extrabold leading-snug text-slate-950 sm:text-3xl">
                {clue}
              </h1>
            </div>

            <div className="mt-7">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {fillPattern(puzzle.answer_pattern, selectedLetters)}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {puzzle.letters.map((letter, tileIndex) => {
                const used = chosen.includes(tileIndex);
                return (
                  <button
                    key={`${puzzle.id}-${tileIndex}`}
                    type="button"
                    disabled={used || Boolean(result)}
                    onClick={() => chooseLetter(tileIndex)}
                    className={`focus-ring grid h-16 w-14 place-items-center rounded-2xl border-b-4 text-2xl font-black uppercase shadow-sm transition sm:h-20 sm:w-16 sm:text-3xl ${
                      used
                        ? "border-slate-200 bg-slate-100 text-slate-300"
                        : "border-sky-700 bg-gradient-to-b from-sky-400 to-sky-600 text-white hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {showHint && !result && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <strong>Hint:</strong> {hint}
              </div>
            )}

            {result && (
              <div
                className={`mt-7 rounded-2xl p-5 ${
                  result.correct
                    ? "bg-emerald-50 text-emerald-950"
                    : "bg-rose-50 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold">
                  {result.correct ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600" />
                  )}
                  {result.correct
                    ? `Correct! +${result.xp} XP`
                    : `Not quite. Correct word: ${result.correct_answer}`}
                </div>
                <p className="mt-2 text-sm leading-6 opacity-80">
                  {result.explanation}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={undo}
                  disabled={!chosen.length || Boolean(result)}
                >
                  <Undo2 className="h-4 w-4" /> Undo
                </Button>
                <Button
                  variant="ghost"
                  onClick={clear}
                  disabled={!chosen.length || Boolean(result)}
                >
                  <Eraser className="h-4 w-4" /> Clear
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowHint(true);
                    if (!showHint) setCoins((value) => Math.max(0, value - 3));
                  }}
                  disabled={Boolean(result)}
                >
                  <Lightbulb className="h-4 w-4" /> Hint
                </Button>
              </div>

              {result ? (
                <Button onClick={next} className="bg-sky-600 hover:bg-sky-700">
                  {index === puzzles.length - 1 ? "Finish game" : "Next word"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={checkWord}
                  disabled={selectedWord.length !== requiredLetters}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  Check word <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultStat({ n, l }) {
  return (
    <div className="rounded-2xl bg-sky-50 p-4">
      <div className="text-2xl font-extrabold text-sky-700">{n}</div>
      <div className="text-xs font-bold text-slate-500">{l}</div>
    </div>
  );
}
