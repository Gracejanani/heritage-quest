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
  Award,
  LogOut,
} from "lucide-react";
import Logo from "./Logo";
import { SearchBar } from "./ui";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";
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
  const { language, setLanguage, languages, t } = useLanguage();
  useEffect(() => setOpen(false), [location.pathname]);
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
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label={t("language")}
          className="focus-ring hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 lg:block"
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
        <form onSubmit={submit} className="hidden w-64 xl:block">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={t("searchPlaceholder")}
          />
        </form>
        <Link
          to="/achievements"
          className="focus-ring hidden rounded-xl p-2 text-heritage-forest hover:bg-emerald-50 sm:block"
          aria-label="Achievements"
        >
          <Award className="h-5 w-5" />
        </Link>
        <Link
          to="/profile"
          className="focus-ring hidden rounded-2xl bg-heritage-green px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-emerald-700 sm:inline-flex"
        >
          {player?.name || "Explorer Profile"}
        </Link>
        <button
          type="button"
          onClick={switchPlayer}
          className="focus-ring hidden rounded-xl p-2 text-slate-500 hover:bg-white hover:text-heritage-saffron sm:block"
          aria-label="Switch explorer"
          title="Switch explorer"
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
              <NavLink
                to="/profile"
                className="rounded-xl px-4 py-3 font-bold text-heritage-green hover:bg-emerald-50"
              >
                {player?.name || "Explorer Profile"}
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
  return (
    <footer className="mt-16 bg-heritage-forest pb-24 pt-12 text-white md:pb-10">
      <div className="container-app grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/70">
            A playful educational platform for exploring Indian history,
            civilization, monuments, art, festivals and culture through games
            and interactive learning.
          </p>
          <p className="mt-5 font-display text-xl font-bold text-emerald-100">
            Our Heritage. Your Quest. A Brighter Tomorrow.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <h3 className="font-bold">Explore</h3>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <Link to="/">Home</Link>
              <Link to="/games">Games</Link>
              <Link to="/learn">Learn</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">Community</h3>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <Link to="/leaderboard">Leaderboard</Link>
              <Link to="/achievements">Achievements</Link>
              <Link to="/profile">Profile</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">Project</h3>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <Link to="/about">About</Link>
              <a href="mailto:hello@heritagequest.local">Contact</a>
              <span>Privacy</span>
              <span>Terms</span>
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
