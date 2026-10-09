import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getPublishedArticles } from "@/lib/articles";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const articles = q ? await getPublishedArticles({ search: q }) : [];

  return (
    <>
      <h1 className="page-heading">{q ? <>Results for “{q}”</> : "Search"}</h1>
      <form action="/search" className="search-form">
        <input name="q" type="search" defaultValue={q} placeholder="Search articles" autoFocus />
        <button type="submit">Search</button>
      </form>
      {q && articles.length === 0 && <p className="muted">No articles matched.</p>}
      <div className="grid">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </>
  );
}
