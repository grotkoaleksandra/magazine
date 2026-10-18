import { isConfigured } from "@/lib/supabase";

export function Loading() {
  return <p className="muted loading">Loading…</p>;
}

export function ErrorNote({ error }: { error: Error }) {
  if (!isConfigured) {
    return (
      <p className="form-error">
        This site isn&apos;t connected to Supabase yet. Add the Supabase URL and publishable key (see README).
      </p>
    );
  }
  return <p className="form-error">Something went wrong: {error.message}</p>;
}
