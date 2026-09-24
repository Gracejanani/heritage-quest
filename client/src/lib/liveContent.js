import { useEffect, useMemo, useState } from "react";
import {
  games as fallbackGames,
  learningTopics as fallbackTopics,
} from "../data/content";
import { supabase } from "./supabase";

const defaultSettings = {
  heroEyebrow: "GAMES FOR A GREATER TOMORROW",
  heroTitle: "Discover India",
  heroAccent: "Through Play!",
  heroDescription:
    "Fun games. Real stories. Our incredible heritage. Explore India’s history, culture, monuments and civilizations through interactive learning adventures.",
  heroImage: "/assets/hero-heritage.jpg",
  featuredTitle: "Learn India. Understand India.",
  featuredAccent: "Preserve India’s Heritage.",
  featuredDescription:
    "Discover people, places, events and traditions through 12 quiz chapters, 2 additional study materials and 120 mixed normal-and-advanced questions.",
  featuredImage: "/assets/hero-heritage.jpg",
  introVideo: "/videos/heritage-quest-intro.mp4",
  dailyChallengeQuestions: 5,
  weeklyGoalPoints: 700,
};

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
  const fallback =
    fallbackTopics.find((item) => item.slug === row.slug) || {};
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

export function useLiveGames() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let active = true;
    if (!supabase) return undefined;

    supabase
      .from("games")
      .select("*")
      .order("title")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not load live games", error);
          return;
        }
        setRows(data || []);
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(
    () => (rows?.length ? rows.map(mergeGame) : fallbackGames),
    [rows],
  );
}

export function useLiveTopics() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let active = true;
    if (!supabase) return undefined;

    supabase
      .from("chapters")
      .select("*")
      .order("title")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not load live chapters", error);
          return;
        }
        setRows(data || []);
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
    if (!rows?.length) return fallbackTopics;
    const liveBySlug = new Map(rows.map((row) => [row.slug, mergeTopic(row)]));
    return fallbackTopics.map((topic) => liveBySlug.get(topic.slug) || topic);
  }, [rows]);
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    let active = true;
    if (!supabase) return undefined;

    supabase
      .from("site_settings")
      .select("payload")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not load site settings", error);
          return;
        }
        if (data?.payload) {
          setSettings((current) => ({ ...current, ...data.payload }));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return settings;
}
