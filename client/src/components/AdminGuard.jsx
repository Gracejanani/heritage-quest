import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    let active = true;

    if (loading) return undefined;
    if (!user?.id || !supabase) {
      setState({ loading: false, allowed: false });
      return undefined;
    }

    supabase
      .rpc("is_admin")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not verify admin access", error);
          setState({ loading: false, allowed: false });
          return;
        }
        setState({ loading: false, allowed: Boolean(data) });
      });

    return () => {
      active = false;
    };
  }, [user?.id, loading]);

  if (loading || state.loading) {
    return (
      <div className="container-app py-20 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 animate-pulse text-heritage-green" />
        <p className="mt-4 font-bold text-slate-600">Checking administrator access…</p>
      </div>
    );
  }

  if (!state.allowed) {
    return (
      <div className="container-app py-20">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-rose-100 bg-white p-8 text-center shadow-card">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
          <h1 className="mt-4 font-display text-3xl font-extrabold text-slate-950">
            Admin access only
          </h1>
          <p className="mt-3 text-slate-600">
            This account does not have permission to open the Heritage Quest admin panel.
          </p>
          <Link
            to="/"
            className="focus-ring mt-6 inline-flex rounded-2xl bg-heritage-green px-5 py-3 font-bold text-white"
          >
            Return to website
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
