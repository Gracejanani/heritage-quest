import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Gamepad2,
  BookOpen,
  Trophy,
  UserRound,
  LogOut,
  ShieldCheck,
  GraduationCap,
  LoaderCircle,
} from "lucide-react";
import Logo from "./Logo";
import DownloadAppButton from "./DownloadAppButton";
import { SearchBar } from "./ui";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";
const links = [
  ["home", "/"],
  ["games", "/games"],
  ["learn", "/learn"],
  ["leaderboard", "/leaderboard"],
  ["about", "/about"],
];
export function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { player, switchPlayer } = usePlayer();
  const { language, setLanguage, languages, t, isTranslatingUi } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    let active = true;
    if (!player?.id || !supabase) {
      setIsAdmin(false);
      setIsTeacher(false);
      return undefined;
    }

    Promise.all([supabase.rpc("is_admin"), supabase.rpc("is_teacher")]).then(
      ([adminResult, teacherResult]) => {
        if (!active) return;
        setIsAdmin(!adminResult.error && Boolean(adminResult.data));
        setIsTeacher(!teacherResult.error && Boolean(teacherResult.data));
      },
    );

    return () => {
      active = false;
    };
  }, [player?.id]);
  const submit = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/games?q=${encodeURIComponent(q)}` : "/games");
  };
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-heritage-cream/92 backdrop-blur-xl">
      <div className="container-app flex h-[76px] items-center gap-5">
        <Logo />
        <nav
          className="ml-auto hidden items-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {links.map(([l, h]) => (
            <NavLink
              key={h}
              to={h}
              className={({ isActive }) =>
                `focus-ring rounded-xl px-4 py-2 text-sm font-bold transition ${isActive ? "bg-orange-50 text-heritage-saffron" : "text-slate-700 hover:bg-white hover:text-heritage-green"}`
              }
            >
              {t(l)}
            </NavLink>
          ))}
        </nav>
        <div className="relative hidden lg:block">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t("language")}
            className={`focus-ring rounded-xl border border-slate-200 bg-white py-2 pl-3 text-sm font-bold text-slate-700 ${isTranslatingUi ? "pr-10" : "pr-3"}`}
          >
            {languages.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
          {isTranslatingUi && (
            <LoaderCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-heritage-green" />
          )}
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="focus-ring hidden items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-heritage-green shadow-sm hover:bg-emerald-50 xl:inline-flex"
          >
            <ShieldCheck className="h-4 w-4" /> {t("admin")}
          </Link>
        )}
        {isTeacher && (
          <Link
            to="/teacher"
            className="focus-ring hidden items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-700 shadow-sm hover:bg-sky-50 xl:inline-flex"
          >
            <GraduationCap className="h-4 w-4" /> {t("teacher")}
          </Link>
        )}
        <DownloadAppButton
          label={t("download")}
          variant="accent"
          className="hidden xl:inline-flex"
        />
        <Link
          to="/profile"
          className="focus-ring hidden rounded-2xl bg-heritage-green px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-emerald-700 sm:inline-flex"
        >
          {player?.name || t("explorerProfile")}
        </Link>
        <button
          type="button"
          onClick={switchPlayer}
          className="focus-ring hidden rounded-xl p-2 text-slate-500 hover:bg-white hover:text-heritage-saffron sm:block"
          aria-label={t("switchExplorer")}
          title={t("switchExplorer")}
        >
          <LogOut className="h-5 w-5" />
        </button>
        <button
          className="focus-ring ml-auto rounded-xl p-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

     <div className="hidden border-t border-slate-200/70 bg-white/80 sm:block">
  <div className="container-app py-3">
    <form onSubmit={submit} className="mx-auto max-w-3xl">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("searchPlaceholder")}
      />
    </form>
  </div>
</div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-app py-4">
            <div className="mb-3">
              <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-400">
                {t("language")}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold text-slate-700"
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <form onSubmit={submit} className="mb-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
              />
            </form>
            <div className="grid gap-1">
              {links.map(([l, h]) => (
                <NavLink
                  key={h}
                  to={h}
                  className="rounded-xl px-4 py-3 font-bold text-slate-700 hover:bg-emerald-50"
                >
                  {t(l)}
                </NavLink>
              ))}
              <NavLink
                to="/achievements"
                className="rounded-xl px-4 py-3 font-bold text-slate-700 hover:bg-emerald-50"
              >
                {t("achievements")}
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className="rounded-xl px-4 py-3 font-bold text-heritage-green hover:bg-emerald-50"
                >
                  {t("adminDashboard")}
                </NavLink>
              )}
              {isTeacher && (
                <NavLink
                  to="/teacher"
                  className="rounded-xl px-4 py-3 font-bold text-sky-700 hover:bg-sky-50"
                >
                  {t("teacherDashboard")}
                </NavLink>
              )}
              <DownloadAppButton
                label={t("downloadAndroidApp")}
                variant="accent"
                className="mt-2 w-full"
              />
              <NavLink
                to="/profile"
                className="rounded-xl px-4 py-3 font-bold text-heritage-green hover:bg-emerald-50"
              >
                {player?.name || t("explorerProfile")}
              </NavLink>
              <button
                type="button"
                onClick={switchPlayer}
                className="rounded-xl px-4 py-3 text-left font-bold text-slate-700 hover:bg-orange-50 hover:text-heritage-saffron"
              >
                {t("switchExplorer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
export function MobileBottomNav() {
  const { t } = useLanguage();
  const items = [
    ["home", "/", Home],
    ["games", "/games", Gamepad2],
    ["learn", "/learn", BookOpen],
    ["rewards", "/achievements", Trophy],
    ["profile", "/profile", UserRound],
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(([l, h, I]) => (
          <NavLink
            key={h}
            to={h}
            className={({ isActive }) =>
              `focus-ring flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold ${isActive ? "text-heritage-green" : "text-slate-500"}`
            }
          >
            <I className="h-5 w-5" />
            <span>{t(l)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-16 bg-heritage-forest pb-24 pt-12 text-white md:pb-10">
      <div className="container-app grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/70">
            {t("footerDescription")}
          </p>
          <p className="mt-5 font-display text-xl font-bold text-emerald-100">
            {t("footerTagline")}
          </p>
          <DownloadAppButton
            label={t("downloadAndroidApp")}
            variant="light"
            className="mt-6"
          />
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <h3 className="font-bold">{t("explore")}</h3>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <Link to="/">{t("home")}</Link>
              <Link to="/games">{t("games")}</Link>
              <Link to="/learn">{t("learn")}</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">{t("community")}</h3>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <Link to="/leaderboard">{t("leaderboard")}</Link>
              <Link to="/achievements">{t("achievements")}</Link>
              <Link to="/profile">{t("profile")}</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">{t("project")}</h3>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <Link to="/about">{t("about")}</Link>
              <a href="mailto:hello@heritagequest.local">{t("contact")}</a>
              <span>{t("privacy")}</span>
              <span>{t("terms")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="page-enter min-h-[70vh]">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
