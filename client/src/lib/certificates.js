import { supabase } from "./supabase";

export async function issueCertificate({ userId, chapterSlug, taskName }) {
  if (!supabase || !userId || !chapterSlug) return null;

  const { data, error } = await supabase
    .from("certificates")
    .upsert(
      {
        user_id: userId,
        chapter_slug: chapterSlug,
        task_name: taskName || chapterSlug,
      },
      { onConflict: "user_id,chapter_slug" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
