"use client";

import { createContext, useActionState, useContext, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { signIn, signOut, signUp } from "@/lib/admin";
import { site } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

const StaffContext = createContext<{ user: User; profile: Profile } | null>(null);

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside AdminShell");
  return ctx;
}

type Session = { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; user: User; profile: Profile | null };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ status: "loading" });

  useEffect(() => {
    async function load(user: User | null) {
      if (!user) return setSession({ status: "signed-out" });
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setSession({ status: "signed-in", user, profile: data as Profile | null });
    }
    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      // Defer so we don't call Supabase from inside its own auth callback.
      if (event !== "TOKEN_REFRESHED") setTimeout(() => load(s?.user ?? null), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (session.status === "loading") return <main className="auth"><p className="muted">Loading…</p></main>;
  if (session.status === "signed-out") return <LoginScreen />;

  const { user, profile } = session;
  if (!profile || profile.role === "pending") {
    return (
      <main className="auth">
        <div className="auth-card">
          <h1 className="auth-brand">Almost there</h1>
          <p>Your account is waiting for an admin to approve it. Ask them to give you access on the Team page.</p>
          <button className="btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <StaffContext.Provider value={{ user, profile }}>
      <div className="admin">
        <aside className="admin-nav">
          <Link href="/admin/" className="admin-brand">
            {site.name}
          </Link>
          <nav>
            <Link href="/admin/edit/" className="btn btn-primary">
              + New article
            </Link>
            <Link href="/admin/">Articles</Link>
            <Link href="/admin/categories/">Sections</Link>
            {profile.role === "admin" && <Link href="/admin/team/">Team</Link>}
            <Link href="/" target="_blank">
              View site ↗
            </Link>
          </nav>
          <div className="admin-user">
            <span>{profile.display_name ?? user.email}</span>
            <button className="link-button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
        <div className="admin-main">{children}</div>
      </div>
    </StaffContext.Provider>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState(signIn, undefined);
  const [upState, upAction, upPending] = useActionState(signUp, undefined);
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;

  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          {site.name}
        </Link>
        <p className="muted">{mode === "in" ? "Staff sign in" : "Create a writer account"}</p>
        <form action={mode === "in" ? inAction : upAction} className="auth-form">
          {mode === "up" && (
            <label>
              Your name
              <input name="name" required autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
            />
          </label>
          {state?.error && <p className="form-error">{state.error}</p>}
          {state?.message && <p className="form-message">{state.message}</p>}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
          <button type="button" className="link-button" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "New writer? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
