"use client";

import { useState } from "react";
import { ErrorNote, Loading } from "@/components/States";
import { createCategory, deleteCategory, type FormState } from "@/lib/admin";
import { fetchCategories } from "@/lib/data";
import { useQuery } from "@/lib/useQuery";

export default function CategoriesPage() {
  const { data: categories, error, loading, reload } = useQuery(fetchCategories, []);
  const [state, setState] = useState<FormState>();
  const [busy, setBusy] = useState(false);

  return (
    <>
      <div className="admin-header">
        <h1>story types</h1>
      </div>
      <p className="muted">Story types label each story (Video, Essay, Interview…). Profile and Interview stories also appear under Profiles.</p>
      <div className="panel">
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            const result = await createCategory(String(new FormData(form).get("name") ?? ""));
            setBusy(false);
            setState(result);
            if (!result?.error) {
              form.reset();
              reload();
            }
          }}
        >
          <input name="name" placeholder="New story type, e.g. Manifesto" required />
          <button className="btn btn-primary" disabled={busy}>
            Add type
          </button>
          {state?.error && <p className="form-error">{state.error}</p>}
          {state?.message && <p className="form-message">{state.message}</p>}
        </form>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote error={error} />
        ) : (
          <ul className="list">
            {categories?.map((c) => (
              <li key={c.id}>
                <span>
                  {c.name} <span className="muted">?s={c.slug}</span>
                </span>
                <button
                  className="link-button danger"
                  onClick={async () => {
                    if (!confirm(`Delete the “${c.name}” section? Its stories will be kept.`)) return;
                    try {
                      await deleteCategory(c.id);
                      reload();
                    } catch (err) {
                      alert((err as Error).message);
                    }
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
