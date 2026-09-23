import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { ageQuestionBanks } from "../src/data/ageQuestionBanks.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const contentPath = path.resolve(here, "../public/data/content.json");
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Set VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY before seeding.",
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const content = JSON.parse(await fs.readFile(contentPath, "utf8"));

const gameRows = (content.games || []).map((game) => ({
  id: String(game.id),
  slug: game.slug,
  title: game.title,
  category: game.category || null,
  difficulty: game.difficulty || null,
  payload: game,
  updated_at: new Date().toISOString(),
}));

const chapterRows = (content.chapters || []).map((chapter) => ({
  slug: chapter.slug,
  title: chapter.title,
  description: chapter.description || null,
  era: chapter.era || null,
  tag: chapter.tag || null,
  payload: chapter,
  updated_at: new Date().toISOString(),
}));

const questionRows = [];
for (const [chapterSlug, questions] of Object.entries(
  content.questionsByChapter || {},
)) {
  questions.forEach((question, index) => {
    questionRows.push({
      id: String(question.id),
      chapter_slug: chapterSlug,
      age_group: "all",
      difficulty: question.difficulty || "Medium",
      question: question.question,
      answers: question.answers,
      correct_index: Number(question.correct),
      explanation: question.explanation || null,
      hint: question.hint || null,
      sort_order: index + 1,
      source_label: "Heritage Quest base question bank",
    });
  });
}

for (const [chapterSlug, groups] of Object.entries(ageQuestionBanks)) {
  for (const [ageGroup, questions] of Object.entries(groups)) {
    questions.forEach((question, index) => {
      questionRows.push({
        id: String(question.id),
        chapter_slug: chapterSlug,
        age_group: ageGroup,
        difficulty: question.difficulty,
        question: question.question,
        answers: question.answers,
        correct_index: Number(question.correct),
        explanation: question.explanation || null,
        hint: question.hint || null,
        sort_order: index + 1,
        source_label: "Client-provided temple reference materials",
      });
    });
  }
}

async function upsert(table, rows, onConflict) {
  if (!rows.length) return;
  const chunkSize = 200;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict });
    if (error) throw error;
  }
  console.log(`Seeded ${rows.length} rows into ${table}`);
}

await upsert("games", gameRows, "id");
await upsert("chapters", chapterRows, "slug");
await upsert("questions", questionRows, "id,age_group");

console.log("Heritage Quest Supabase seed complete.");
