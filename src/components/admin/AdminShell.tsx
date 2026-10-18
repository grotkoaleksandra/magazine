"use client";

import { createContext, useActionState, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { signIn, signOut, signUp } from "@/lib/admin";
import { site } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { isStaffRole, type Profile } from "@/lib/types";

type StaffContextValue = { user: User; profile: Profile; staff: boolean; reloadProfile: () => void };
const StaffContext = createContext<StaffContextValue | null>(null);

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside AdminShell");
  return ctx;
}

type Session = { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; user: User; profile: Profile | null };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ status: "loading" });

  const load = useCallback(async (user: User | null) => {
    if (!user) return setSession({ status: "signed-out" });
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setSession({ status: "signed-in", user, profile: data as Profile | null });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      // Defer so we don't call Supabase from inside its own auth callback.
      if (event !== "TOKEN_REFRESHED") setTimeout(() => load(s?.user ?? null), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  if (session.status === "loading") return <main className="auth"><p className="muted">Loading…</p></main>;
  if (session.status === "signed-out") return <LoginScreen />;

  const { user, profile } = session;
  if (!profile) {
    return (
      <main className="auth">
        <div className="auth-card">
          <h1 className="auth-brand">One moment</h1>
          <p>We couldn&apos;t load your profile. Refresh the page, or sign out and back in.</p>
          <button className="btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </main>
    );
  }
  const staff = isStaffRole(profile.role);

  return (
    <StaffContext.Provider value={{ user, profile, staff, reloadProfile: () => load(user) }}>
      <div className="admin">
        <aside className="admin-nav">
          <Link href="/admin/" className="admin-brand">
            {site.name}
          </Link>
          <nav>
            <Link href="/admin/edit/" className="btn btn-primary">
              + {staff ? "New article" : "Write a post"}
            </Link>
            <Link href="/admin/">{staff ? "Articles" : "My posts"}</Link>
            {staff && <Link href="/admin/?tab=review">Awaiting review</Link>}
            {staff && <Link href="/admin/categories/">Sections</Link>}
            {profile.role === "admin" && <Link href="/admin/team/">Team</Link>}
            {profile.role === "admin" && <Link href="/admin/settings/">Site settings</Link>}
            <Link href="/admin/profile/">My profile</Link>
            <Link href="/" target="_blank">
              View site ↗
            </Link>
          </nav>
          <div className="admin-user">
            <span>
              {profile.display_name ?? user.email}
              <span className="muted"> · {profile.role}</span>
            </span>
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
        <p className="muted">{mode === "in" ? "Log in to your account" : "Join to write for the Members\u2019 Board"}</p>
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
            {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
