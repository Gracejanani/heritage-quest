import { supabase } from "./supabase";

export function getCertificateAwardTier(correctAnswers = 0) {
  const correct = Number(correctAnswers || 0);
  if (correct >= 7) return "gold";
  if (correct >= 4) return "silver";
  return "bronze";
}

export async function issueCertificate({
  userId,
  chapterSlug,
  taskName,
  correctAnswers = 0,
  totalQuestions = 10,
}) {
  if (!supabase || !userId || !chapterSlug) return null;

  const correct = Math.max(0, Number(correctAnswers || 0));
  const total = Math.max(1, Number(totalQuestions || 10));
  const awardTier = getCertificateAwardTier(correct);

  const { data, error } = await supabase
    .from("certificates")
    .upsert(
      {
        user_id: userId,
        chapter_slug: chapterSlug,
        task_name: taskName || chapterSlug,
        correct_answers: correct,
        total_questions: total,
        award_tier: awardTier,
      },
      { onConflict: "user_id,chapter_slug" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
