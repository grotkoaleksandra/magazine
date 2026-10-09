"use client";

import { useActionState } from "react";
import { createCategory } from "../../actions";

export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, undefined);
  return (
    <form action={action} className="inline-form">
      <input name="name" placeholder="New section name, e.g. Food" required />
      <button className="btn btn-primary" disabled={pending}>
        Add section
      </button>
      {state?.error && <p className="form-error">{state.error}</p>}
      {state?.message && <p className="form-message">{state.message}</p>}
    </form>
  );
}
