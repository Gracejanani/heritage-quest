import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { calculateAge, getAgeGroup } from "../lib/age";

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function ensureProfile(user) {
  if (!supabase || !user?.id) return null;

  const existing = await fetchProfile(user.id);
  if (existing) return existing;

  const metadata = user.user_metadata || {};
  if (!metadata.dob) return null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        full_name:
          metadata.full_name || user.email?.split("@")[0] || "Explorer",
        dob: metadata.dob,
        age_group: metadata.age_group || getAgeGroup(metadata.dob),
        preferred_language: metadata.preferred_language || "en",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (userId = session?.user?.id) => {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }
    try {
      const next = await fetchProfile(userId);
      setProfile(next);
      return next;
    } catch (error) {
      console.error("Could not load Heritage Quest profile", error);
      return null;
    }
  }, [session?.user?.id]);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const nextSession = data.session || null;
      setSession(nextSession);
      if (nextSession?.user?.id) {
        try {
          const nextProfile = await ensureProfile(nextSession.user);
          if (active) setProfile(nextProfile);
        } catch (error) {
          console.error(error);
        }
      }
      if (active) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setTimeout(() => {
        ensureProfile(nextSession.user)
          .then((nextProfile) => {
            if (active) setProfile(nextProfile);
          })
          .catch(console.error)
          .finally(() => {
            if (active) setLoading(false);
          });
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async ({ name, email, password, dob, preferredLanguage = "en" }) => {
      if (!supabase) {
        return {
          ok: false,
          message:
            "Supabase is not configured yet. Add the project URL and anon key to Vercel.",
        };
      }

      const cleanName = String(name || "").trim().replace(/\s+/g, " ");
      const cleanEmail = String(email || "").trim().toLowerCase();
      const age = calculateAge(dob);

      if (cleanName.length < 2) {
        return { ok: false, message: "Please enter the student's full name." };
      }
      if (!cleanEmail.includes("@")) {
        return { ok: false, message: "Please enter a valid email address." };
      }
      if (String(password || "").length < 6) {
        return { ok: false, message: "Password must be at least 6 characters." };
      }
      if (age === null || age < 1) {
        return { ok: false, message: "Please enter a valid date of birth." };
      }

      const ageGroup = getAgeGroup(dob);
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            dob,
            age_group: ageGroup,
            preferred_language: preferredLanguage,
          },
        },
      });

      if (error) return { ok: false, message: error.message };

      if (data.user && data.session) {
        await supabase.from("profiles").upsert(
          {
            user_id: data.user.id,
            full_name: cleanName,
            dob,
            age_group: ageGroup,
            preferred_language: preferredLanguage,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
        await refreshProfile(data.user.id);
      }

      return {
        ok: true,
        needsEmailConfirmation: Boolean(data.user && !data.session),
      };
    },
    [refreshProfile],
  );

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) {
      return {
        ok: false,
        message:
          "Supabase is not configured yet. Add the project URL and anon key to Vercel.",
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: String(email || "").trim().toLowerCase(),
      password,
    });

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      configured: supabaseConfigured,
      session,
      user: session?.user || null,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signUp, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
