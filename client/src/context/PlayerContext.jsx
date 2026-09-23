import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { calculateAge, getAgeGroup } from "../lib/age";

const PlayerContext = createContext(null);

function localKey(userId, key) {
  return userId ? `heritageQuest:user:${userId}:${key}` : null;
}

function readLocal(userId, key, fallback = null) {
  const keyName = localKey(userId, key);
  if (!keyName) return fallback;
  try {
    const raw = localStorage.getItem(keyName);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function PlayerProvider({ children }) {
  const { user, profile, signOut } = useAuth();
  const [progressMap, setProgressMap] = useState({});
  const [progressReady, setProgressReady] = useState(false);

  const player = useMemo(() => {
    if (!user) return null;
    const dob = profile?.dob || user.user_metadata?.dob || "";
    const name =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Explorer";

    return {
      id: user.id,
      name,
      email: user.email,
      dob,
      age: calculateAge(dob),
      ageGroup: profile?.age_group || getAgeGroup(dob),
      preferredLanguage:
        profile?.preferred_language ||
        user.user_metadata?.preferred_language ||
        "en",
    };
  }, [user, profile]);

  useEffect(() => {
    let active = true;
    setProgressReady(false);
    setProgressMap({});

    if (!user?.id) {
      setProgressReady(true);
      return () => {
        active = false;
      };
    }

    const hydrate = async () => {
      const next = {};

      try {
        if (supabase) {
          const { data, error } = await supabase
            .from("quiz_progress")
            .select("*")
            .eq("user_id", user.id);

          if (error) throw error;

          for (const row of data || []) {
            const key = `quiz:${row.chapter_slug}`;
            next[key] = {
              index: Number(row.current_index || 0),
              score: Number(row.score || 0),
              xp: Number(row.xp || 0),
              coins: Number(row.coins ?? 50),
              finished: Boolean(row.finished),
              answers: Array.isArray(row.answers) ? row.answers : [],
              updatedAt: row.updated_at,
            };
            try {
              localStorage.setItem(
                localKey(user.id, key),
                JSON.stringify(next[key]),
              );
            } catch {
              // Browser cache is only a fallback.
            }
          }
        }
      } catch (error) {
        console.error("Could not hydrate cloud progress", error);
      }

      if (Object.keys(next).length === 0) {
        try {
          const prefix = `heritageQuest:user:${user.id}:quiz:`;
          for (let index = 0; index < localStorage.length; index += 1) {
            const storageKey = localStorage.key(index);
            if (!storageKey?.startsWith(prefix)) continue;
            const chapterSlug = storageKey.slice(prefix.length);
            const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
            next[`quiz:${chapterSlug}`] = value;
          }
        } catch {
          // Ignore malformed local data.
        }
      }

      if (active) {
        setProgressMap(next);
        setProgressReady(true);
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const saveProgress = useCallback(
    (key, value) => {
      if (!user?.id) return;
      const payload = { ...value, updatedAt: new Date().toISOString() };

      setProgressMap((current) => ({ ...current, [key]: payload }));

      try {
        localStorage.setItem(localKey(user.id, key), JSON.stringify(payload));
      } catch {
        // Cloud save below remains the source of truth.
      }

      if (!supabase || !key.startsWith("quiz:")) return;
      const chapterSlug = key.slice("quiz:".length);

      supabase
        .from("quiz_progress")
        .upsert(
          {
            user_id: user.id,
            chapter_slug: chapterSlug,
            current_index: Number(payload.index || 0),
            score: Number(payload.score || 0),
            xp: Number(payload.xp || 0),
            coins: Number(payload.coins ?? 50),
            finished: Boolean(payload.finished),
            answers: Array.isArray(payload.answers) ? payload.answers : [],
            updated_at: payload.updatedAt,
          },
          { onConflict: "user_id,chapter_slug" },
        )
        .then(({ error }) => {
          if (error) console.error("Could not save quiz progress", error);
        });
    },
    [user?.id],
  );

  const getProgress = useCallback(
    (key, fallback = null) => {
      if (!user?.id) return fallback;
      return readLocal(user.id, key, fallback);
    },
    [user?.id],
  );

  const logActivity = useCallback(
    (activityType, details = {}) => {
      if (!user?.id || !supabase) return;
      supabase
        .from("activity_log")
        .insert({
          user_id: user.id,
          activity_type: activityType,
          chapter_slug: details.chapterSlug || null,
          details,
        })
        .then(({ error }) => {
          if (error) console.error("Could not log activity", error);
        });
    },
    [user?.id],
  );

  const getSummary = useCallback(() => {
    const records = Object.entries(progressMap)
      .filter(([key]) => key.startsWith("quiz:"))
      .map(([key, value]) => ({
        chapterSlug: key.slice("quiz:".length),
        ...value,
      }));

    const completed = records.filter((record) => record.finished).length;
    const xp = records.reduce((sum, record) => sum + Number(record.xp || 0), 0);
    const coins =
      50 +
      records.reduce(
        (sum, record) => sum + Math.max(0, Number(record.coins || 50) - 50),
        0,
      );
    const badges = Math.min(
      6,
      Math.floor(completed / 2) + (completed > 0 ? 1 : 0),
    );
    const latest = [...records].sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    )[0];

    return {
      completed,
      xp,
      coins,
      badges,
      overallProgress: Math.min(100, Math.round((completed / 12) * 100)),
      latestChapter: latest?.chapterSlug || "ancient-india",
    };
  }, [progressMap]);

  const switchPlayer = useCallback(() => {
    signOut();
  }, [signOut]);

  const value = useMemo(
    () => ({
      player,
      knownProfiles: [],
      progressReady,
      saveProgress,
      getProgress,
      getSummary,
      logActivity,
      switchPlayer,
    }),
    [
      player,
      progressReady,
      saveProgress,
      getProgress,
      getSummary,
      logActivity,
      switchPlayer,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return context;
}
