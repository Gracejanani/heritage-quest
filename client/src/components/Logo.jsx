import React from "react";
import { Link } from "react-router-dom";

function HeritageMark({ light = false }) {
  const green = light ? "#FFFFFF" : "#087F5B";
  const saffron = light ? "#F4B942" : "#F97316";
  const dark = light ? "#FFFFFF" : "#4B2E1E";

  return (
    <span
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md ${
        light
          ? "border-white/20 bg-white/10"
          : "border-emerald-100 bg-gradient-to-br from-white via-amber-50 to-emerald-50"
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 56 56"
        className="h-9 w-9"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Classical arch */}
        <path
          d="M12 39V26C12 17.7 18.7 11 27 11H29C37.3 11 44 17.7 44 26V39"
          stroke={dark}
          strokeWidth="2.3"
          strokeLinecap="round"
        />

        {/* Heritage pillars */}
        <path d="M16 39V29" stroke={green} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M40 39V29" stroke={green} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 39H44" stroke={dark} strokeWidth="2.3" strokeLinecap="round" />

        {/* Modern chakra / compass */}
        <circle cx="28" cy="26" r="8.5" stroke={green} strokeWidth="2" />
        <circle cx="28" cy="26" r="1.8" fill={saffron} />
        <path d="M28 17.5V21" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M28 31V34.5" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19.5 26H23" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M33 26H36.5" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M22.2 20.2L24.6 22.6" stroke={green} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M31.4 29.4L33.8 31.8" stroke={green} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M33.8 20.2L31.4 22.6" stroke={green} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M24.6 29.4L22.2 31.8" stroke={green} strokeWidth="1.4" strokeLinecap="round" />

        {/* Saffron crown line for a classic Indian accent */}
        <path
          d="M18 15.5C21 13.2 24.3 12 28 12C31.7 12 35 13.2 38 15.5"
          stroke={saffron}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Base detail */}
        <path
          d="M18 42.5H38"
          stroke={saffron}
          strokeWidth="2.2"
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
      className="group inline-flex shrink-0 items-center gap-3.5"
      aria-label="Heritage Quest Home"
    >
      <HeritageMark light={light} />

      <span className="min-w-0">
        <span
          className={`block whitespace-nowrap font-display text-[22px] font-extrabold leading-none tracking-[-0.025em] ${
            light ? "text-white" : "text-[#4B2E1E]"
          }`}
        >
          Heritage{" "}
          <span className={light ? "text-amber-200" : "text-heritage-green"}>
            Quest
          </span>
        </span>

        <span
          className={`mt-1.5 block whitespace-nowrap font-serif text-[10px] font-semibold tracking-[0.12em] ${
            light ? "text-white/65" : "text-slate-500"
          }`}
        >
          Explore · Learn · Preserve
        </span>
      </span>
    </Link>
  );
}
