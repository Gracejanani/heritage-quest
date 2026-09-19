import React from "react";
import { Link } from "react-router-dom";

function Emblem({ light = false }) {
  const stroke = light ? "#FFFFFF" : "#0F5D4A";
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-11 w-11 drop-shadow-sm"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="29"
        fill={light ? "rgba(255,255,255,.10)" : "#FFF8EA"}
        stroke={light ? "rgba(255,255,255,.65)" : "#087F5B"}
        strokeWidth="2.5"
      />
      <circle
        cx="32"
        cy="32"
        r="20"
        fill="none"
        stroke={light ? "rgba(255,255,255,.5)" : "#1D6FA5"}
        strokeWidth="1.5"
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1="32"
          y1="12"
          x2="32"
          y2="17"
          stroke={light ? "#E8FFF6" : "#1D6FA5"}
          strokeWidth="1.4"
          transform={`rotate(${i * 30} 32 32)`}
        />
      ))}
      <path
        d="M20 39h24M23 39V30l9-7 9 7v9M28 39V31h8v8"
        fill="none"
        stroke={stroke}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 14l3.8 10.5L32 29l-3.8-4.5L32 14z"
        fill="#F97316"
        stroke="#F4B942"
        strokeWidth="1"
      />
      <circle cx="32" cy="32" r="2.6" fill="#F4B942" />
    </svg>
  );
}

export default function Logo({ compact = false, light = false }) {
  return (
    <Link
      to="/"
      className="focus-ring inline-flex items-center gap-3 rounded-xl"
      aria-label="Heritage Quest home"
    >
      <Emblem light={light} />
      {!compact && (
        <div className="leading-none">
          <div
            className={`font-display text-xl font-extrabold sm:text-2xl ${light ? "text-white" : "text-heritage-brown"}`}
          >
            Heritage{" "}
            <span
              className={light ? "text-emerald-200" : "text-heritage-green"}
            >
              Quest
            </span>
          </div>
          <div
            className={`mt-1 text-[10px] font-bold tracking-wide ${light ? "text-white/65" : "text-slate-500"}`}
          >
            Explore • Learn • Play • Preserve
          </div>
        </div>
      )}
    </Link>
  );
}
