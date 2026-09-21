import React from "react";
import { Link } from "react-router-dom";

function HeritageMark({ light = false }) {
  const ring = light ? "#FFFFFF" : "#087F5B";
  const saffron = light ? "#F4B942" : "#F97316";
  const center = light ? "#FFFFFF" : "#064E3B";

  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border shadow-sm transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105 ${
        light
          ? "border-white/20 bg-white/10"
          : "border-emerald-100 bg-white"
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        className="h-8 w-8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="14" stroke={ring} strokeWidth="2.2" />
        <circle cx="24" cy="24" r="2.4" fill={center} />

        <path d="M24 10V17" stroke={ring} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M24 31V38" stroke={ring} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M10 24H17" stroke={ring} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M31 24H38" stroke={ring} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M14.1 14.1L19 19" stroke={ring} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M29 29L33.9 33.9" stroke={ring} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M33.9 14.1L29 19" stroke={ring} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M19 29L14.1 33.9" stroke={ring} strokeWidth="1.7" strokeLinecap="round" />

        <path
          d="M25.5 20.2L31.5 16.5L27.8 22.5L22.5 27.8L25.5 20.2Z"
          fill={saffron}
        />
        <path
          d="M13 36.5C16.2 34.8 19.8 34 24 34C28.2 34 31.8 34.8 35 36.5"
          stroke={center}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className="group inline-flex shrink-0 items-center gap-3"
      aria-label="Heritage Quest Home"
    >
      <HeritageMark light={light} />

      <span className="min-w-0 leading-none">
        <span
          className={`block whitespace-nowrap font-display text-[21px] font-extrabold tracking-[-0.02em] ${
            light ? "text-white" : "text-heritage-brown"
          }`}
        >
          Heritage{" "}
          <span className={light ? "text-emerald-200" : "text-heritage-green"}>
            Quest
          </span>
        </span>

        <span
          className={`mt-1.5 block whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.16em] ${
            light ? "text-white/60" : "text-slate-400"
          }`}
        >
          Explore · Learn · Play
        </span>
      </span>
    </Link>
  );
}
