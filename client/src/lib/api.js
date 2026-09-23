import { getAgeQuestionBank } from "../data/ageQuestionBanks";

let contentPromise;

async function getBundledContent() {
  if (!contentPromise) {
    contentPromise = fetch("/data/content.json").then((res) => {
      if (!res.ok) throw new Error(`Bundled content ${res.status}`);
      return res.json();
    });
  }
  return contentPromise;
}

const ADVANCED_QUESTION_INDEXES = new Set([3, 6, 9]); // Q4, Q7, Q10
const CORRECT_POSITION_PATTERNS = [
  [2, 0, 3, 1, 2, 3, 0, 1, 3, 2],
  [1, 3, 0, 2, 3, 1, 2, 0, 1, 3],
  [3, 1, 2, 0, 1, 3, 2, 0, 3, 1],
  [0, 2, 1, 3, 2, 0, 3, 1, 0, 2],
];

function prepareQuestion(question, index, chapterIndex = 0, ageGroup = "scholar") {
  const sourceAnswers = [...question.answers];
  const correctText = sourceAnswers[question.correct];
  const remaining = sourceAnswers.filter((_, answerIndex) => answerIndex !== question.correct);
  const desiredCorrectIndex =
    CORRECT_POSITION_PATTERNS[chapterIndex % CORRECT_POSITION_PATTERNS.length][index % 10];

  const answers = [];
  let remainingIndex = 0;
  for (let position = 0; position < 4; position += 1) {
    answers.push(
      position === desiredCorrectIndex
        ? correctText
        : remaining[remainingIndex++],
    );
  }

  const difficulty =
    ageGroup === "entry"
      ? "Entry"
      : ageGroup === "junior"
        ? "Medium"
        : ADVANCED_QUESTION_INDEXES.has(index)
          ? "Advanced"
          : "Medium";

  return {
    ...question,
    difficulty,
    answers,
    correct: desiredCorrectIndex,
  };
}

function publicQuestion({ correct, explanation, ...question }) {
  return question;
}

async function localApi(path, options = {}) {
  const content = await getBundledContent();
  const {
    games = [],
    chapters = [],
    questionsByChapter = {},
    achievements = [],
    leaderboard = [],
  } = content;

  const method = String(options.method || "GET").toUpperCase();
  const [pathname, queryString = ""] = path.split("?");
  const params = new URLSearchParams(queryString);

  if (method === "GET" && pathname === "/health") {
    return {
      ok: true,
      service: "Heritage Quest bundled prototype",
      mode: "static",
      questions: Object.values(questionsByChapter).flat().length,
    };
  }

  if (method === "GET" && pathname === "/games") {
    const q = String(params.get("q") || "").toLowerCase().trim();
    const category = String(params.get("category") || "");
    const difficulty = String(params.get("difficulty") || "");
    const items = games.filter(
      (game) =>
        (!q || JSON.stringify(game).toLowerCase().includes(q)) &&
        (!category || category === "All" || game.category === category) &&
        (!difficulty || difficulty === "All" || game.difficulty === difficulty),
    );
    return { items, total: items.length };
  }

  if (method === "GET" && pathname.startsWith("/games/")) {
    const slug = decodeURIComponent(pathname.slice("/games/".length));
    const game = games.find((item) => item.slug === slug);
    if (!game) throw new Error("Game not found");
    return game;
  }

  if (method === "GET" && pathname === "/chapters") {
    return {
      items: chapters.map((chapter) => ({
        ...chapter,
        questionCount: questionsByChapter[chapter.slug]?.length || 0,
      })),
    };
  }

  const questionMatch = pathname.match(/^\/chapters\/([^/]+)\/questions$/);
  if (method === "GET" && questionMatch) {
    const slug = decodeURIComponent(questionMatch[1]);
    const chapter = chapters.find((item) => item.slug === slug);
    if (!chapter) throw new Error("Chapter not found");
    const chapterIndex = Math.max(0, chapters.findIndex((item) => item.slug === slug));
    const ageGroup = String(params.get("ageGroup") || "scholar");
    const ageBank = getAgeQuestionBank(slug, ageGroup);
    const sourceQuestions = ageBank || questionsByChapter[slug] || [];
    const questions = sourceQuestions
      .slice(0, 10)
      .map((question, index) =>
        prepareQuestion(question, index, chapterIndex, ageGroup),
      );
    return {
      chapter: chapter.title,
      chapterSlug: slug,
      totalQuestions: questions.length,
      questions: questions.map(publicQuestion),
    };
  }

  const chapterMatch = pathname.match(/^\/chapters\/([^/]+)$/);
  if (method === "GET" && chapterMatch) {
    const slug = decodeURIComponent(chapterMatch[1]);
    const chapter = chapters.find((item) => item.slug === slug);
    if (!chapter) throw new Error("Chapter not found");
    return {
      ...chapter,
      questionCount: questionsByChapter[slug]?.length || 0,
    };
  }

  if (method === "POST" && pathname === "/quiz/check-answer") {
    const body = JSON.parse(options.body || "{}");
    const ageGroup = String(body.ageGroup || "scholar");
    const ageBank = getAgeQuestionBank(body.chapterSlug, ageGroup);
    const rawQuestions = (ageBank || questionsByChapter[body.chapterSlug] || []).slice(0, 10);
    const questionIndex = rawQuestions.findIndex((item) => item.id === body.questionId);
    if (questionIndex < 0) throw new Error("Question not found");
    const chapterIndex = Math.max(
      0,
      chapters.findIndex((item) => item.slug === body.chapterSlug),
    );
    const question = prepareQuestion(
      rawQuestions[questionIndex],
      questionIndex,
      chapterIndex,
      ageGroup,
    );
    const selected = Number(body.answerIndex);
    const correct = selected === question.correct;
    return {
      correct,
      correctIndex: question.correct,
      explanation: question.explanation,
      difficulty: question.difficulty,
      xp: correct ? (question.difficulty === "Advanced" ? 30 : 20) : 0,
    };
  }

  if (method === "GET" && pathname === "/achievements") {
    return { items: achievements };
  }

  if (method === "GET" && pathname === "/leaderboard") {
    return { items: leaderboard };
  }

  if (method === "GET" && pathname === "/recommendations") {
    const current = String(params.get("chapter") || "");
    return {
      items: games.filter((game) => game.chapterSlug !== current).slice(0, 3),
    };
  }

  if (method === "GET" && pathname === "/challenges/daily") {
    const picks = chapters.slice(0, 5).map((chapter, index) => {
      const list = questionsByChapter[chapter.slug] || [];
      const question = list[index % Math.max(1, list.length)];
      return question
        ? {
            chapterSlug: chapter.slug,
            chapter: chapter.title,
            ...publicQuestion(question),
          }
        : null;
    }).filter(Boolean);
    return {
      id: "daily-heritage",
      title: "Today's Heritage Challenge",
      rewardXp: 100,
      totalQuestions: picks.length,
      questions: picks,
    };
  }

  if (method === "GET" && pathname === "/search") {
    const q = String(params.get("q") || "").toLowerCase().trim();
    if (!q) return { games: [], chapters: [] };
    return {
      games: games
        .filter((game) => JSON.stringify(game).toLowerCase().includes(q))
        .slice(0, 8),
      chapters: chapters
        .filter((chapter) => JSON.stringify(chapter).toLowerCase().includes(q))
        .slice(0, 8),
    };
  }

  if (pathname === "/progress") {
    // Prototype progress is stored per explorer in localStorage by PlayerContext.
    return { ok: true, mode: "local-prototype" };
  }

  throw new Error(`No local fallback for ${method} ${pathname}`);
}

export async function api(path, options = {}) {
  try {
    const res = await fetch(`/api${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    if (res.ok) return res.json();

    // On the Vercel frontend-only prototype, /api is not deployed.
    // Fall back to the bundled quiz/content data instead.
    if (res.status === 404 || res.status === 405 || res.status >= 500) {
      return localApi(path, options);
    }

    throw new Error(`API ${res.status}`);
  } catch (error) {
    return localApi(path, options);
  }
}

export function saveLocalProgress(key, value) {
  localStorage.setItem(`heritageQuest:${key}`, JSON.stringify(value));
}

export function getLocalProgress(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`heritageQuest:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
