"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { ErrorNote, Loading } from "@/components/States";
import { fetchPublished } from "@/lib/data";
import { useQuery } from "@/lib/useQuery";

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Search />
    </Suspense>
  );
}

function Search() {
  const router = useRouter();
  const q = useSearchParams().get("q")?.trim() ?? "";
  const { data: articles, error, loading } = useQuery(
    () => (q ? fetchPublished({ search: q }) : Promise.resolve([])),
    [q],
  );

  return (
    <>
      <h1 className="page-heading">{q ? <>Results for “{q}”</> : "Search"}</h1>
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          const next = String(new FormData(e.currentTarget).get("q") ?? "");
          router.push(`/search/?q=${encodeURIComponent(next)}`);
        }}
      >
        <input key={q} name="q" type="search" defaultValue={q} placeholder="Search articles" autoFocus />
        <button type="submit">Search</button>
      </form>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : (
        <>
          {q && articles?.length === 0 && <p className="muted">No articles matched.</p>}
          <div className="grid">
            {articles?.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
