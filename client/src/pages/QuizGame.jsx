import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Coins,
  Lightbulb,
  RotateCcw,
  Sparkles,
  XCircle,
  BookOpen,
  Trophy,
  Eye,
  Award,
} from "lucide-react";
import { learningTopics } from "../data/content";
import { api } from "../lib/api";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";
import { Badge, Button, ProgressBar, useToast } from "../components/ui";
import { AGE_GROUPS } from "../lib/age";
import { issueCertificate } from "../lib/certificates";

export default function QuizGame() {
  const { chapterSlug = "ancient-india" } = useParams();
  const topic =
    learningTopics.find((t) => t.slug === chapterSlug) || learningTopics[0];
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(50);
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [hint, setHint] = useState(false);
  const [answers, setAnswers] = useState([]);
  const toast = useToast();
  const {
    player,
    saveProgress,
    getProgress,
    progressReady: cloudProgressReady,
    logActivity,
  } = usePlayer();
  const { language, setLanguage, languages, t, translateText } = useLanguage();
  const [restored, setRestored] = useState(false);
  const [quizProgressReady, setQuizProgressReady] = useState(false);
  const ageGroup = player?.ageGroup || "scholar";
  const ageInfo = AGE_GROUPS[ageGroup] || AGE_GROUPS.scholar;
  const [translatedQuestion, setTranslatedQuestion] = useState(null);
  const [translatedExplanation, setTranslatedExplanation] = useState("");
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!cloudProgressReady) return () => {};

    let active = true;
    setQuizProgressReady(false);
    setLoading(true);
    setError("");
    const saved = getProgress(`quiz:${chapterSlug}`, null);
    setIndex(saved?.index || 0);
    setSelected(null);
    setResult(null);
    setFinished(Boolean(saved?.finished));
    setReviewing(false);
    setAnswers(saved?.answers || []);
    setScore(saved?.score || 0);
    setXp(saved?.xp || 0);
    setCoins(saved?.coins ?? 50);
    setRestored(Boolean(saved));
    setQuizProgressReady(true);
    api(
      `/chapters/${chapterSlug}/questions?ageGroup=${encodeURIComponent(ageGroup)}`,
    )
      .then((data) => {
        if (active) setQuestions(data.questions || []);
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load the chapter questions. Please refresh the page and try again.",
          );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [chapterSlug, getProgress, cloudProgressReady, ageGroup]);

  useEffect(() => {
    if (!quizProgressReady) return;
    saveProgress(`quiz:${chapterSlug}`, {
      index,
      score,
      xp,
      coins,
      finished,
      answers,
    });
  }, [
    chapterSlug,
    index,
    score,
    xp,
    coins,
    finished,
    answers,
    saveProgress,
    quizProgressReady,
  ]);

  const q = questions[index];

  useEffect(() => {
    let active = true;
    if (!q) return () => {};

    if (language === "en") {
      setTranslatedQuestion(null);
      setTranslating(false);
      return () => {};
    }

    setTranslatedQuestion(null);
    setTranslating(true);
    Promise.all([
      translateText(q.question),
      ...q.answers.map((answerText) => translateText(answerText)),
      translateText(q.hint || ""),
    ])
      .then(([questionText, ...translatedParts]) => {
        if (!active) return;
        setTranslatedQuestion({
          question: questionText,
          answers: translatedParts.slice(0, 4),
          hint: translatedParts[4] || q.hint,
        });
      })
      .finally(() => active && setTranslating(false));

    return () => {
      active = false;
    };
  }, [q?.id, language, translateText]);

  useEffect(() => {
    let active = true;
    if (!result?.explanation || language === "en") {
      setTranslatedExplanation("");
      return () => {};
    }

    translateText(result.explanation).then((text) => {
      if (active) setTranslatedExplanation(text);
    });

    return () => {
      active = false;
    };
  }, [result?.explanation, language, translateText]);

  const visibleQ = q
    ? {
        ...q,
        question: translatedQuestion?.question || q.question,
        answers: translatedQuestion?.answers || q.answers,
        hint: translatedQuestion?.hint || q.hint,
      }
    : q;

  const progress = useMemo(
    () =>
      questions.length
        ? Math.round(
            ((index + (selected !== null ? 1 : 0)) / questions.length) * 100,
          )
        : 0,
    [index, selected, questions.length],
  );

  const answer = async (i) => {
    if (selected !== null || !q) return;
    setSelected(i);
    try {
      const data = await api("/quiz/check-answer", {
        method: "POST",
        body: JSON.stringify({
          chapterSlug,
          questionId: q.id,
          answerIndex: i,
          answerText: q.answers[i],
          answers: q.answers,
          ageGroup,
        }),
      });
      setResult(data);
      const gainedScore = data.correct
        ? q.difficulty === "Advanced"
          ? 150
          : q.difficulty === "Entry"
            ? 60
            : 100
        : 0;
      const gainedCoins = data.correct
        ? q.difficulty === "Advanced"
          ? 15
          : q.difficulty === "Entry"
            ? 6
            : 10
        : 0;
      setScore((s) => s + gainedScore);
      setXp((v) => v + (data.xp || 0));
      setCoins((c) => c + gainedCoins);
      setAnswers((a) => [
        ...a,
        { question: q, selected: i, ...data, gainedScore, gainedCoins },
      ]);
      logActivity("question_answered", {
        chapterSlug,
        questionId: q.id,
        difficulty: q.difficulty,
        selectedAnswer: i,
        correct: Boolean(data.correct),
        xpEarned: Number(data.xp || 0),
        ageGroup,
      });
      if (data.correct)
        confetti({ particleCount: 45, spread: 50, origin: { y: 0.72 } });
    } catch {
      setSelected(null);
      toast(
        "Could not check the answer. Please confirm the backend is running.",
        "error",
      );
    }
  };

  const finishQuiz = async () => {
    const totalCorrect = answers.filter((a) => a.correct).length;
    const accuracy = questions.length
      ? Math.round((totalCorrect / questions.length) * 100)
      : 0;
    const completionBonus = 100;
    const perfectBonus = totalCorrect === questions.length ? 200 : 0;
    const finalXp = xp + completionBonus + perfectBonus;
    const finalCoins = coins + 120;
    setXp(finalXp);
    setCoins(finalCoins);
    setFinished(true);
    logActivity("chapter_completed", {
      chapterSlug,
      taskName: topic.title,
      score,
      xp: finalXp,
      coins: finalCoins,
      accuracy,
      ageGroup,
    });

    issueCertificate({
      userId: player?.id,
      chapterSlug,
      taskName: topic.title,
    }).catch((certificateError) => {
      console.error("Could not issue cloud certificate", certificateError);
    });

    confetti({ particleCount: 150, spread: 85, origin: { y: 0.65 } });
    try {
      await api("/progress", {
        method: "POST",
        body: JSON.stringify({
          gameId: "chapter-quiz",
          chapterSlug,
          score,
          coins: 120,
          xp: completionBonus + perfectBonus + xp,
          accuracy,
          completed: true,
        }),
      });
    } catch {
      /* localStorage already preserves local progress */
    }
  };

  const next = () => {
    if (!result) return;
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
      setResult(null);
      setHint(false);
    } else finishQuiz();
  };

  const reset = () => {
    setIndex(0);
    setSelected(null);
    setResult(null);
    setScore(0);
    setXp(0);
    setCoins(50);
    setFinished(false);
    setReviewing(false);
    setHint(false);
    setAnswers([]);
  };

  if (loading)
    return (
      <div className="grid min-h-[80vh] place-items-center bg-heritage-forest text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-heritage-gold" />
          <p className="mt-4 font-bold">Loading {topic.title}...</p>
        </div>
      </div>
    );
  if (error || !questions.length)
    return (
      <div className="container-app grid min-h-[70vh] place-items-center py-12">
        <div className="max-w-xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-card">
          <XCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h1 className="mt-4 text-2xl font-extrabold">Chapter unavailable</h1>
          <p className="mt-3 text-slate-600">
            {error || "No questions were found for this chapter."}
          </p>
          <Button as={Link} to="/learn" className="mt-6">
            Back to Learn
          </Button>
        </div>
      </div>
    );

  if (reviewing)
    return (
      <ReviewScreen
        topic={topic}
        answers={answers}
        onBack={() => setReviewing(false)}
      />
    );

  if (finished) {
    const correctCount = answers.filter((a) => a.correct).length;
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="container-app grid min-h-[75vh] place-items-center py-12">
        <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-card sm:p-12">
          <div className="badge-pop mx-auto grid h-24 w-24 place-items-center rounded-full bg-amber-100 text-amber-600">
            <Trophy className="h-12 w-12" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold text-slate-950">
            {t("chapterComplete")}
          </h1>
          <p className="mt-3 text-slate-600">
            You finished <strong>{topic.title}</strong> as a{" "}
            <strong>{ageInfo.label}</strong>. Review your answers, download your
            certificate, or continue your Heritage Quest.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultStat n={`${correctCount}/${questions.length}`} l="Correct" />
            <ResultStat n={`${accuracy}%`} l="Accuracy" />
            <ResultStat n={`+${xp}`} l="XP" />
            <ResultStat n={coins} l="Coins" />
          </div>
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
            <Sparkles className="mr-2 inline h-4 w-4" /> Achievement progress
            updated: {topic.title} Explorer
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => setReviewing(true)} variant="outline">
              <Eye className="h-4 w-4" /> Review Answers
            </Button>
            <Button onClick={reset} variant="outline">
              <RotateCcw className="h-4 w-4" /> Try Again
            </Button>
            <Button as={Link} to={`/certificate/${chapterSlug}`} variant="secondary">
              <Award className="h-4 w-4" /> Download Certificate
            </Button>
            <Button as={Link} to="/learn">
              Next Chapter <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] bg-heritage-forest py-6 sm:py-10">
      <div className="container-app max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 text-white">
          <Link
            to={`/learn/${chapterSlug}`}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </Link>
          <div className="text-center">
            <div className="text-xs font-bold text-white/60">
              {player?.name} · {topic.title}
            </div>
            <div className="text-sm font-extrabold">
              {t("question")} {index + 1} {t("of")} {questions.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={t("language")}
              className="focus-ring rounded-xl border border-white/15 bg-white/10 px-2 py-1.5 text-xs font-bold text-white"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code} className="text-slate-900">
                  {item.label}
                </option>
              ))}
            </select>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
              {xp} XP
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
              <Coins className="h-4 w-4 text-heritage-gold" /> {coins}
            </span>
          </div>
        </div>
        <ProgressBar
          value={progress}
          className="mt-5 [&>div]:bg-white/15 [&>div>div]:bg-heritage-gold"
        />
        {restored && index > 0 && !finished && (
          <div className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-center text-xs font-bold text-white/75">
            Resumed {player?.name}'s saved quest at question {index + 1}.
          </div>
        )}
        <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="h-2 bg-gradient-to-r from-heritage-saffron via-heritage-gold to-heritage-green" />
          <div className="p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge
                tone={
                  q.difficulty === "Advanced"
                    ? "red"
                    : q.difficulty === "Entry"
                      ? "green"
                      : "gold"
                }
              >
                {q.difficulty}
              </Badge>
              <span className="text-xs font-bold text-slate-400">
                {translating
                  ? t("translating")
                  : `${ageInfo.label} · ${ageInfo.range}`}
              </span>
            </div>
            <div className="mt-5 flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-orange-100 text-heritage-saffron">
                <CircleHelp className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-extrabold leading-snug text-slate-950 sm:text-3xl">
                {visibleQ.question}
              </h1>
            </div>
            <div className="mt-7 grid gap-3">
              {visibleQ.answers.map((a, i) => {
                const answered = selected !== null && result;
                const correct = answered && i === result.correctIndex;
                const chosen = i === selected;
                const state = correct
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : answered && chosen && !correct
                    ? "border-rose-400 bg-rose-50 text-rose-900"
                    : "border-slate-200 bg-white hover:border-heritage-green/50 hover:bg-emerald-50/40";
                return (
                  <button
                    key={`${q.id}-${i}`}
                    onClick={() => answer(i)}
                    disabled={selected !== null}
                    className={`focus-ring flex items-center justify-between rounded-2xl border-2 p-4 text-left font-bold transition ${state}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {a}
                    </span>
                    {correct && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    )}
                    {answered && chosen && !correct && (
                      <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                    )}
                  </button>
                );
              })}
            </div>
            {hint && selected === null && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <strong>{t("hint")}:</strong> {visibleQ.hint}
              </div>
            )}
            {result && (
              <div
                className={`mt-6 rounded-2xl p-5 ${result.correct ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950"}`}
              >
                <div className="font-extrabold">
                  {result.correct
                    ? `✓ ${t("correct")} +${result.xp} XP`
                    : `✕ ${t("notQuite")} ${t("correctAnswer")}: ${visibleQ.answers[result.correctIndex]}`}
                </div>
                <p className="mt-2 text-sm leading-6 opacity-80">
                  {translatedExplanation || result.explanation}
                </p>
              </div>
            )}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setHint(true);
                  if (!hint) {
                    setCoins((c) => Math.max(0, c - 5));
                    toast("Hint used: −5 coins");
                  }
                }}
                disabled={selected !== null}
              >
                <Lightbulb className="h-4 w-4" /> {t("hint")}
              </Button>
              <div className="flex items-center gap-2">
                <Button as={Link} to={`/learn/${chapterSlug}`} variant="ghost">
                  <BookOpen className="h-4 w-4" /> {t("learnFirst")}
                </Button>
                <Button onClick={next} disabled={!result}>
                  {index === questions.length - 1 ? t("finish") : t("next")}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultStat({ n, l }) {
  return (
    <div className="rounded-2xl bg-heritage-cream p-4">
      <div className="text-2xl font-extrabold text-heritage-green">{n}</div>
      <div className="text-xs font-bold text-slate-500">{l}</div>
    </div>
  );
}

function ReviewScreen({ topic, answers, onBack }) {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container-app max-w-4xl">
        <button
          onClick={onBack}
          className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to result
        </button>
        <div className="mt-4">
          <h1 className="font-display text-4xl font-extrabold">
            Review: {topic.title}
          </h1>
          <p className="mt-2 text-slate-500">
            Your answer, the correct answer and the explanation for every
            question.
          </p>
        </div>
        <div className="mt-8 space-y-5">
          {answers.map((a, i) => (
            <article
              key={a.question.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-extrabold text-slate-400">
                  Question {i + 1}
                </div>
                <Badge
                  tone={a.question.difficulty === "Advanced" ? "red" : "gold"}
                >
                  {a.question.difficulty}
                </Badge>
              </div>
              <h2 className="mt-3 text-lg font-extrabold">
                {a.question.question}
              </h2>
              <div
                className={`mt-4 rounded-2xl p-4 text-sm ${a.correct ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}
              >
                <strong>
                  {a.correct
                    ? "✓ Your answer was correct"
                    : "✕ Your answer was incorrect"}
                  :
                </strong>{" "}
                {a.question.answers[a.selected]}
              </div>
              {!a.correct && (
                <div className="mt-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  <strong>✓ Correct answer:</strong>{" "}
                  {a.question.answers[a.correctIndex]}
                </div>
              )}
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {a.explanation}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
