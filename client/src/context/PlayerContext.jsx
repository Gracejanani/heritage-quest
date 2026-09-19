import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const PlayerContext = createContext(null);
const PROFILES_KEY = "heritageQuest:profiles";
const ACTIVE_KEY = "heritageQuest:activePlayer";

function normalizeName(value = "") {
  return value.trim().replace(/\s+/g, " ");
}

function makePlayerId(name) {
  return encodeURIComponent(normalizeName(name).toLocaleLowerCase("en-IN"));
}

function readProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || "{}");
  } catch {
    return {};
  }
}

function readSessionPlayer() {
  try {
    const id = sessionStorage.getItem(ACTIVE_KEY);
    if (!id) return null;
    const profiles = readProfiles();
    return profiles[id] || null;
  } catch {
    return null;
  }
}

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(() => readSessionPlayer());
  const [profiles, setProfiles] = useState(() => readProfiles());

  const startPlayer = useCallback((rawName) => {
    const name = normalizeName(rawName);
    if (name.length < 2 || name.length > 40) {
      return { ok: false, message: "Please enter a name between 2 and 40 characters." };
    }

    const id = makePlayerId(name);
    const now = new Date().toISOString();
    const next = {
      ...profiles,
      [id]: {
        id,
        name,
        createdAt: profiles[id]?.createdAt || now,
        lastSeenAt: now,
      },
    };

    localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
    sessionStorage.setItem(ACTIVE_KEY, id);
    setProfiles(next);
    setPlayer(next[id]);
    return { ok: true, player: next[id], returning: Boolean(profiles[id]) };
  }, [profiles]);

  const switchPlayer = useCallback(() => {
    sessionStorage.removeItem(ACTIVE_KEY);
    setPlayer(null);
  }, []);

  const scopedKey = useCallback((key) => {
    if (!player) return null;
    return `heritageQuest:player:${player.id}:${key}`;
  }, [player]);

  const saveProgress = useCallback((key, value) => {
    const storageKey = scopedKey(key);
    if (!storageKey) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ ...value, updatedAt: new Date().toISOString() }),
    );
  }, [scopedKey]);

  const getProgress = useCallback((key, fallback = null) => {
    const storageKey = scopedKey(key);
    if (!storageKey) return fallback;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }, [scopedKey]);

  const getSummary = useCallback(() => {
    if (!player) {
      return {
        completed: 0,
        xp: 0,
        coins: 50,
        badges: 0,
        overallProgress: 0,
        latestChapter: "ancient-india",
      };
    }

    const prefix = `heritageQuest:player:${player.id}:quiz:`;
    const records = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      try {
        const value = JSON.parse(localStorage.getItem(key) || "{}");
        records.push({
          chapterSlug: key.slice(prefix.length),
          ...value,
        });
      } catch {
        // Ignore malformed local entries.
      }
    }

    const completed = records.filter((r) => r.finished).length;
    const xp = records.reduce((sum, r) => sum + Number(r.xp || 0), 0);
    const coins = 50 + records.reduce(
      (sum, r) => sum + Math.max(0, Number(r.coins || 50) - 50),
      0,
    );
    const badges = Math.min(6, Math.floor(completed / 2) + (completed > 0 ? 1 : 0));
    const latest = [...records]
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0];

    return {
      completed,
      xp,
      coins,
      badges,
      overallProgress: Math.min(100, Math.round((completed / 12) * 100)),
      latestChapter: latest?.chapterSlug || "ancient-india",
    };
  }, [player]);

  const knownProfiles = useMemo(
    () => Object.values(profiles).sort((a, b) =>
      String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || "")),
    ),
    [profiles],
  );

  const value = useMemo(
    () => ({
      player,
      knownProfiles,
      startPlayer,
      switchPlayer,
      saveProgress,
      getProgress,
      getSummary,
    }),
    [player, knownProfiles, startPlayer, switchPlayer, saveProgress, getProgress, getSummary],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return context;
}
