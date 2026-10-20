"use client";

import Link from "next/link";
import { Loading } from "@/components/States";
import { fetchSettings } from "@/lib/settings";
import { useQuery } from "@/lib/useQuery";

// Placeholder until the real manifesto is written in Dashboard → Site settings.
const DEFAULT_MANIFESTO = `Burn yer boats.
There is no going back to the shore.
This is a magazine by the members, for the members, about the members.
We make things. We show them to each other. We show up for each other.
No experts. No algorithm. Just people doing the thing.
If you're here, you're in.`;

export default function ManifestoPage() {
  const { data, loading } = useQuery(fetchSettings, []);
  if (loading) return <Loading />;
  const lines = (data?.manifesto?.trim() || DEFAULT_MANIFESTO).split(/\n+/).filter(Boolean);

  return (
    <article className="manifesto">
      <h1 className="page-heading">manifesto</h1>
      <ol className="manifesto-lines">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      <div className="join-actions">
        <Link href="/admin/?join=1" className="btn btn-primary btn-big">
          Join
        </Link>
      </div>
    </article>
  );
}
