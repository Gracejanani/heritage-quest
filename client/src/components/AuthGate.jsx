import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { AGE_GROUPS, calculateAge, getAgeGroup } from "../lib/age";

export default function AuthGate({ children }) {
  const { user, profile, loading, configured, signIn, signUp } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const agePreview = useMemo(() => {
    const age = calculateAge(form.dob);
    if (age === null || age < 1) return null;
    const group = getAgeGroup(form.dob);
    return { age, group, ...AGE_GROUPS[group] };
  }, [form.dob]);

  useEffect(() => {
    if (!user?.id || !profile?.preferred_language) return;
    const savedLanguage = profile.preferred_language;
    if (
      savedLanguage !== language &&
      languages.some((item) => item.code === savedLanguage)
    ) {
      setLanguage(savedLanguage);
    }
    // Run when a different authenticated profile is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.preferred_language]);

  // Keep an already-authenticated screen mounted during short auth refreshes.
  // This is especially important when an administrator re-verifies the same
  // account to unlock protected student account information.
  if (user && profile) return children;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-heritage-cream">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-emerald-100 border-t-heritage-green" />
          <p className="mt-4 font-bold text-slate-600">Opening Heritage Quest…</p>
        </div>
      </div>
    );
  }

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError("");
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result =
        mode === "register"
          ? await signUp({
              ...form,
              preferredLanguage: language,
            })
          : await signIn({
              email: form.email,
              password: form.password,
            });

      if (!result.ok) {
        setError(result.message || "Could not continue.");
        return;
      }

      if (result.needsEmailConfirmation) {
        setMessage(
          "Registration successful. Please verify the email once, then come back and log in.",
        );
        setMode("login");
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-heritage-cream">
      <div className="container-app grid min-h-screen items-center gap-8 py-8 lg:grid-cols-[1fr_.92fr]">
        <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-orange-100 bg-white p-6 shadow-card sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="focus-ring max-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
              aria-label="Language"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            {[
              ["login", t("login")],
              ["register", t("register")],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setError("");
                  setMessage("");
                }}
                className={`focus-ring rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                  mode === value
                    ? "bg-white text-heritage-green shadow-sm"
                    : "text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h1 className="mt-7 font-display text-4xl font-extrabold text-heritage-brown">
            {mode === "register" ? t("createExplorerAccount") : t("welcomeBack")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {mode === "register" ? t("registerCopy") : t("loginCopy")}
          </p>

          {!configured && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Supabase keys are not configured in this deployment yet. Add
              VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.
            </div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "register" && (
              <Field
                icon={UserRound}
                label={t("studentName")}
                value={form.name}
                onChange={update("name")}
                placeholder="e.g. Aarav Sharma"
                autoComplete="name"
              />
            )}

            <Field
              icon={Mail}
              label={t("email")}
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="student@example.com"
              autoComplete="email"
            />

            <div>
              <label className="text-sm font-extrabold text-slate-800">{t("password")}</label>
              <div className="relative mt-2">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  placeholder={t("passwordHint")}
                  className="focus-ring h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 font-semibold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="text-sm font-extrabold text-slate-800">
                  Date of birth
                </label>
                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={form.dob}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={update("dob")}
                    className="focus-ring h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-semibold outline-none"
                  />
                </div>
                {agePreview && (
                  <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
                    <strong>{agePreview.label}</strong> · {agePreview.range}
                    <div className="mt-1 text-xs text-emerald-700">
                      Age {agePreview.age}. {agePreview.description}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !configured}
              className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-heritage-green px-5 font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? t("pleaseWait")
                : mode === "register"
                  ? t("registerEnter")
                  : t("loginContinue")}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>

            {error && (
              <p role="alert" className="text-sm font-semibold text-rose-600">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                {message}
              </p>
            )}
          </form>
        </section>

        <aside className="relative hidden min-h-[610px] overflow-hidden rounded-[2.5rem] lg:block">
          <img
            src="/assets/hero-heritage.jpg"
            alt="Indian heritage learning"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-heritage-forest/95 via-heritage-forest/15 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white">
            <div className="text-xs font-extrabold tracking-[.18em] text-heritage-gold">
              ONE ACCOUNT · ONE LEARNING JOURNEY
            </div>
            <h2 className="mt-3 font-display text-4xl font-extrabold">
              Learn at the level that is right for you.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">
              Your profile, age group, quiz activity, progress, achievements and
              completion certificates can follow you across devices through Supabase.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  return (
    <div>
      <label className="text-sm font-extrabold text-slate-800">{label}</label>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="focus-ring h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-semibold outline-none"
        />
      </div>
    </div>
  );
}
