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
import { answerFromKnowledge } from "../lib/heritageChat";
import { supabase } from "../lib/supabase";

const DEFAULT_SETTINGS = {
  dailyChallengeQuestions: 5,
  weeklyGoalPoints: 700,
};

const QUICK_QUESTIONS = [
  "Good morning",
  "When was the Taj Mahal built?",
  "Who built Qutub Minar?",
  "What is Heritage Quest?",
];

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

export default function HeritageChatbot() {
  const { pathname } = useLocation();
  const { player } = usePlayer();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [games, setGames] = useState(fallbackGames);
  const [topics, setTopics] = useState(fallbackTopics);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [questionBank, setQuestionBank] = useState([]);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text: "Hello! Ask me a short question about Indian heritage or Heritage Quest.",
    },
  ]);
  const endRef = useRef(null);
  const replyTimerRef = useRef(null);
  const replyPendingRef = useRef(false);

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
  }, [messages, open, typing]);

  useEffect(
    () => () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
      replyPendingRef.current = false;
    },
    [],
  );

  const knowledge = useMemo(
    () => ({ games, topics, settings, player, questionBank }),
    [games, topics, settings, player, questionBank],
  );

  const ask = (value) => {
    const question = String(value || "").trim();
    if (!question || replyPendingRef.current) return;
    replyPendingRef.current = true;

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
    ]);
    setDraft("");
    setTyping(true);

    replyTimerRef.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}-${current.length}`,
          role: "bot",
          text: reply,
        },
      ]);
      replyPendingRef.current = false;
      setTyping(false);
      replyTimerRef.current = null;
    }, 420);
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
                    Online · Short verified answers
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
            Ask naturally about Indian heritage or the website. Replies stay
            clear and concise.
          </div>

          <div
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4"
            aria-live="polite"
          >
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
            {typing ? (
              <div
                className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
                aria-label="Heritage Helper is typing"
                role="status"
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    aria-hidden="true"
                    className="h-2 w-2 animate-bounce rounded-full bg-heritage-green"
                    style={{ animationDelay: `${dot * 120}ms` }}
                  />
                ))}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => ask(question)}
                  disabled={typing}
                  className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-heritage-green hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                  placeholder="Ask a short question…"
                  className="focus-ring max-h-24 min-h-11 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-heritage-green focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={!draft.trim() || typing}
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
