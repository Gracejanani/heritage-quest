import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Search,
  X,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  loading,
  ...props
}) {
  const variants = {
    primary: "bg-heritage-saffron text-white hover:bg-orange-600 shadow-soft",
    secondary: "bg-heritage-green text-white hover:bg-emerald-700 shadow-soft",
    outline:
      "border border-heritage-forest/30 bg-white text-heritage-forest hover:bg-emerald-50",
    ghost: "text-heritage-forest hover:bg-emerald-50",
    dark: "bg-heritage-forest text-white hover:bg-emerald-950",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  return (
    <Tag
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </Tag>
  );
}

export function Badge({ children, tone = "green", className = "" }) {
  const tones = {
    green: "bg-emerald-100 text-emerald-800",
    orange: "bg-orange-100 text-orange-800",
    gold: "bg-amber-100 text-amber-800",
    blue: "bg-sky-100 text-sky-800",
    gray: "bg-slate-100 text-slate-700",
    red: "bg-rose-100 text-rose-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, label, className = "" }) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>{label}</span>
          <span>{safe}%</span>
        </div>
      )}

      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-200"
        aria-label={label || "Progress"}
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className="h-full rounded-full bg-heritage-green transition-all duration-700"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{placeholder}</span>

      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />

      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="focus-ring h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none placeholder:text-slate-400 transition hover:border-emerald-200 focus:border-heritage-green focus:shadow-md"
      />
    </label>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="inline-flex rounded-2xl bg-slate-100 p-1" role="tablist">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`focus-ring rounded-xl px-4 py-2 text-sm font-bold transition ${
            value === item
              ? "bg-white text-heritage-forest shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => onChange(item)}
          role="tab"
          aria-selected={value === item}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  ariaLabel = "Select option",
  className = "",
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="focus-ring w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="modal-title"
            className="font-display text-2xl font-bold text-slate-950"
          >
            {title}
          </h2>

          <button
            type="button"
            className="focus-ring rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };

  return (
    <ToastContext.Provider value={push}>
      {children}

      <div
        className="fixed right-4 top-24 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
          >
            {t.type === "error" ? (
              <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-heritage-green" />
            )}

            <p className="text-sm font-semibold text-slate-700">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
