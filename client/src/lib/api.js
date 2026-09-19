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
    const questions = questionsByChapter[slug] || [];
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
    const questions = questionsByChapter[body.chapterSlug] || [];
    const question = questions.find((item) => item.id === body.questionId);
    if (!question) throw new Error("Question not found");
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
