import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bot,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  games as fallbackGames,
  learningTopics as fallbackTopics,
} from "../data/content";
import { usePlayer } from "../context/PlayerContext";
import { supabase } from "../lib/supabase";

const DEFAULT_SETTINGS = {
  dailyChallengeQuestions: 5,
  weeklyGoalPoints: 700,
};

const QUICK_QUESTIONS = [
  "How do I start?",
  "Which questions will I get?",
  "How do certificates work?",
  "Show me the games",
  "What languages are available?",
];

const AGE_LABELS = {
  entry: "Little Explorer · Entry level",
  junior: "Young Explorer · Medium level",
  scholar: "Heritage Scholar · Medium + Advanced",
  open: "Open Explorer · Full question set",
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\u0900-\u097f\u0980-\u09ff\u0b80-\u0bff\u0c00-\u0c7f\u0c80-\u0cff\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(normalize(phrase)));
}

function titleMatch(text, item) {
  const title = normalize(item?.title);
  return Boolean(title && title.length >= 4 && text.includes(title));
}

function findVerifiedStudyQuestion(text, questionBank) {
  const q = normalize(text);
  if (!q || q.length < 8) return null;

  return (
    questionBank.find((item) => {
      const candidate = normalize(item?.question);
      if (!candidate) return false;

      return (
        q === candidate ||
        (q.length >= 20 && candidate.includes(q)) ||
        (candidate.length >= 20 && q.includes(candidate))
      );
    }) || null
  );
}

function mergeGame(row) {
  const fallback =
    fallbackGames.find((item) => item.id === row.id || item.slug === row.slug) ||
    {};

  return {
    ...fallback,
    ...(row.payload || {}),
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category || fallback.category,
    difficulty: row.difficulty || fallback.difficulty,
  };
}

function mergeTopic(row) {
  const fallback = fallbackTopics.find((item) => item.slug === row.slug) || {};

  return {
    ...fallback,
    ...(row.payload || {}),
    slug: row.slug,
    title: row.title,
    description: row.description || fallback.description || "",
    era: row.era || fallback.era || "",
    tag: row.tag || fallback.tag || "",
  };
}

function answerFromKnowledge({
  question,
  games,
  topics,
  settings,
  player,
  questionBank,
}) {
  const q = normalize(question);

  if (!q) return "Please type a Heritage Quest question.";

  if (
    includesAny(q, [
      "hi",
      "hello",
      "hey",
      "vanakkam",
      "வணக்கம்",
      "namaste",
      "नमस्ते",
    ])
  ) {
    return "Hello! I’m the Heritage Quest Helper. I answer only verified questions about this website and its learning content.";
  }

  const verifiedQuestion = findVerifiedStudyQuestion(q, questionBank);
  if (verifiedQuestion?.explanation) {
    return `Brief explanation: ${verifiedQuestion.explanation}`;
  }

  const matchedTopic = topics.find((topic) => titleMatch(q, topic));
  if (matchedTopic) {
    const learn = Array.isArray(matchedTopic.learn)
      ? matchedTopic.learn.slice(0, 5).join(", ")
      : "";

    return [
      `${matchedTopic.title}: ${matchedTopic.description || "This is a Heritage Quest learning topic."}`,
      matchedTopic.era ? `Era: ${matchedTopic.era}.` : "",
      learn ? `Key areas: ${learn}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  const matchedGame = games.find((game) => titleMatch(q, game));
  if (matchedGame) {
    const details = [
      matchedGame.description,
      matchedGame.category ? `Category: ${matchedGame.category}.` : "",
      matchedGame.difficulty ? `Difficulty: ${matchedGame.difficulty}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `${matchedGame.title}: ${details || "This game is available from the Games page."}`;
  }

  if (
    includesAny(q, [
      "how do i start",
      "how to start",
      "start learning",
      "begin",
      "register",
      "sign up",
      "create account",
    ])
  ) {
    return "Register with your student name, email, password and date of birth. Heritage Quest uses your date of birth to select the suitable question level. Then use Learn to study and Games to play.";
  }

  if (
    includesAny(q, ["login", "log in", "sign in", "enter again", "same account"])
  ) {
    return "Use the same registered email and password on the Login tab. Your Supabase account reconnects you to your saved profile and progress.";
  }

  if (
    includesAny(q, [
      "age",
      "age group",
      "question level",
      "which questions",
      "my level",
      "difficulty",
      "entry level",
      "advanced level",
    ])
  ) {
    const personal = player?.ageGroup
      ? ` Your profile is “${AGE_LABELS[player.ageGroup] || player.ageGroup}”.`
      : "";

    return `Ages 1–5 receive Entry questions, ages 6–9 receive Medium questions, ages 10–16 receive a Medium + Advanced mix, and ages 17+ use the full Open Explorer set.${personal}`;
  }

  if (
    includesAny(q, [
      "certificate",
      "download certificate",
      "completion certificate",
    ])
  ) {
    return "After an eligible chapter or task is completed, Heritage Quest can create a certificate using the student name, completed task, date and verification code. It can be downloaded or printed as PDF.";
  }

  if (
    includesAny(q, ["leaderboard", "ranking", "rank", "points", "weekly goal"])
  ) {
    return `The leaderboard uses real quiz scores saved in Supabase and supports Daily, Weekly and All Time views. The current weekly goal is ${Number(settings.weeklyGoalPoints || 700)} points.`;
  }

  if (
    includesAny(q, [
      "daily challenge",
      "today challenge",
      "today progress",
      "progress today",
    ])
  ) {
    return `The daily challenge reads the student’s real quiz activity from Supabase. The current target is ${Number(settings.dailyChallengeQuestions || 5)} answered questions for the day.`;
  }

  if (
    includesAny(q, ["progress", "saved progress", "activity", "my score"])
  ) {
    return "Quiz progress, scores and gameplay activity are saved with the student’s Supabase account so the learning journey can continue after logging in again.";
  }

  if (
    includesAny(q, [
      "language",
      "languages",
      "tamil",
      "hindi",
      "telugu",
      "kannada",
      "urdu",
      "22",
    ])
  ) {
    return "Heritage Quest includes English plus the 22 Scheduled Indian languages in the language selector: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu and Urdu.";
  }

  if (
    includesAny(q, ["show games", "games available", "list games", "what games"])
  ) {
    const names = games.map((game) => game.title).filter(Boolean);
    return `Current games: ${names.join(", ")}. Open the Games page to choose one.`;
  }

  if (
    includesAny(q, [
      "learning chapters",
      "chapters",
      "study material",
      "study materials",
      "what can i learn",
      "learn page",
      "topics",
    ])
  ) {
    const names = topics.map((topic) => topic.title).filter(Boolean);
    return `Current learning topics: ${names.join(", ")}. Open Learn to study a topic before starting a challenge.`;
  }

  if (
    includesAny(q, ["profile", "student profile", "settings", "my account"])
  ) {
    return "Use Profile to view student information and the saved learning summary. Use Settings for student preferences.";
  }

  if (
    includesAny(q, [
      "what is heritage quest",
      "about website",
      "what is this website",
      "website purpose",
      "heritage quest",
    ])
  ) {
    return "Heritage Quest is an educational platform for exploring Indian history, civilization, monuments, art, festivals and culture through learning chapters, games, quizzes, progress tracking and certificates.";
  }

  return "I don’t have a verified Heritage Quest answer for that. I only answer questions supported by this website’s content and features.";
}

export default function HeritageChatbot() {
  const { pathname } = useLocation();
  const { player } = usePlayer();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [games, setGames] = useState(fallbackGames);
  const [topics, setTopics] = useState(fallbackTopics);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [questionBank, setQuestionBank] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I’m the Heritage Quest Helper. Ask me about the website or a study question from one of the Heritage Quest chapters.",
    },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    let active = true;

    fetch("/data/content.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((content) => {
        if (!active || !content?.questionsByChapter) return;

        const verifiedQuestions = Object.entries(
          content.questionsByChapter,
        ).flatMap(([chapterSlug, questions]) =>
          (questions || []).map((item) => ({
            ...item,
            chapterSlug,
          })),
        );

        setQuestionBank(verifiedQuestions);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!supabase) return undefined;

    const loadLiveKnowledge = async () => {
      const [gamesRes, topicsRes, settingsRes] = await Promise.all([
        supabase.from("games").select("*").order("title"),
        supabase.from("chapters").select("*").order("title"),
        supabase
          .from("site_settings")
          .select("payload")
          .eq("id", "main")
          .maybeSingle(),
      ]);

      if (!active) return;

      if (!gamesRes.error && gamesRes.data?.length) {
        setGames(gamesRes.data.map(mergeGame));
      }

      if (!topicsRes.error && topicsRes.data?.length) {
        const liveBySlug = new Map(
          topicsRes.data.map((row) => [row.slug, mergeTopic(row)]),
        );
        const fallbackSlugs = new Set(
          fallbackTopics.map((topic) => topic.slug),
        );

        setTopics([
          ...fallbackTopics.map(
            (topic) => liveBySlug.get(topic.slug) || topic,
          ),
          ...topicsRes.data
            .filter((row) => !fallbackSlugs.has(row.slug))
            .map(mergeTopic),
        ]);
      }

      if (!settingsRes.error && settingsRes.data?.payload) {
        setSettings((current) => ({
          ...current,
          ...settingsRes.data.payload,
        }));
      }
    };

    loadLiveKnowledge();

    return () => {
      active = false;
    };
  }, [player?.id]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const knowledge = useMemo(
    () => ({ games, topics, settings, player, questionBank }),
    [games, topics, settings, player, questionBank],
  );

  const ask = (value) => {
    const question = String(value || "").trim();
    if (!question) return;

    const reply = answerFromKnowledge({
      question,
      ...knowledge,
    });

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}-${current.length}`,
        role: "user",
        text: question,
      },
      {
        id: `bot-${Date.now()}-${current.length}`,
        role: "bot",
        text: reply,
      },
    ]);

    setDraft("");
  };

  const submit = (event) => {
    event.preventDefault();
    ask(draft);
  };

  if (pathname.startsWith("/play/")) {
    return null;
  }

  return (
    <>
      {open && (
        <section
          className="fixed bottom-24 right-3 z-[110] flex h-[min(68vh,560px)] w-[calc(100vw-1.5rem)] max-w-sm flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl md:bottom-6 md:right-6"
          role="dialog"
          aria-label="Heritage Quest Helper"
        >
          <div className="bg-heritage-forest p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display text-lg font-extrabold">
                    Heritage Helper
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Website-only verified answers
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close Heritage Helper"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-emerald-50 px-4 py-2.5 text-xs font-semibold leading-5 text-emerald-900">
            Ask a website question or a specific chapter study question. If it
            is not in Heritage Quest, I will not invent an answer.
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-heritage-green px-4 py-3 text-sm font-semibold leading-6 text-white"
                    : "max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                }
              >
                {message.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => ask(question)}
                  className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-heritage-green hover:bg-emerald-100"
                >
                  {question}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="flex items-end gap-2">
              <label className="flex-1">
                <span className="sr-only">Ask Heritage Quest Helper</span>
                <textarea
                  rows="1"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      ask(draft);
                    }
                  }}
                  placeholder="Ask about Heritage Quest…"
                  className="focus-ring max-h-24 min-h-11 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-heritage-green focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={!draft.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-heritage-green text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send question"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-24 right-4 z-[109] flex items-center gap-2 rounded-full bg-heritage-green px-4 py-3 font-extrabold text-white shadow-[0_14px_35px_rgba(5,89,68,0.35)] transition hover:-translate-y-1 hover:bg-emerald-700 md:bottom-6 md:right-6"
        aria-label={open ? "Close Heritage Helper" : "Open Heritage Helper"}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Need help?</span>
            <Sparkles className="h-4 w-4 text-amber-300" />
          </>
        )}
      </button>
    </>
  );
}
