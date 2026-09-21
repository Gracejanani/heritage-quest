import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 shrink-0"
      aria-label="Heritage Quest Home"
    >
      {/* Modern emblem */}
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl border shadow-sm ${
          light
            ? "border-white/20 bg-white/10"
            : "border-emerald-100 bg-gradient-to-br from-emerald-50 to-orange-50"
        }`}
      >
        <div
          className={`relative h-7 w-7 rounded-full border-2 ${
            light ? "border-white" : "border-heritage-green"
          }`}
        >
          <div
            className={`absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              light ? "bg-white" : "bg-heritage-saffron"
            }`}
          />
          <div
            className={`absolute bottom-[-3px] left-1/2 h-1.5 w-5 -translate-x-1/2 rounded-full ${
              light ? "bg-white/80" : "bg-heritage-green"
            }`}
          />
        </div>
      </div>

      {/* Brand text */}
      <div className="leading-tight">
        <h1
          className={`font-display text-2xl font-extrabold whitespace-nowrap ${
            light ? "text-white" : "text-heritage-brown"
          }`}
        >
          Heritage{" "}
          <span className={light ? "text-emerald-200" : "text-heritage-green"}>
            Quest
          </span>
        </h1>

        <p
          className={`text-xs font-semibold whitespace-nowrap ${
            light ? "text-white/70" : "text-slate-500"
          }`}
        >
          Explore • Learn • Play • Preserve
        </p>
      </div>
    </Link>
  );
}