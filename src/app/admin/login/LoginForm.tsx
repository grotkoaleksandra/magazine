"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "../actions";

export function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState(signIn, undefined);
  const [upState, upAction, upPending] = useActionState(signUp, undefined);
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;

  return (
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
  );
}
