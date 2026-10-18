"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { ErrorNote, Loading } from "@/components/States";
import { BOARD_NAME, fetchCategories, fetchPublished, fetchTagCounts } from "@/lib/data";
import { normalizeTags } from "@/lib/format";
import { useQuery } from "@/lib/useQuery";

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Search />
    </Suspense>
  );
}

type Filters = { q: string; tags: string[]; section: string };

function toUrl({ q, tags, section }: Filters) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  for (const t of tags) p.append("tag", t);
  if (section) p.set("section", section);
  const s = p.toString();
  return `/search/${s ? `?${s}` : ""}`;
}

function Search() {
  const router = useRouter();
  const params = useSearchParams();
  const filters: Filters = {
    q: params.get("q")?.trim() ?? "",
    tags: params.getAll("tag"),
    section: params.get("section") ?? "",
  };
  const go = (next: Partial<Filters>) => router.push(toUrl({ ...filters, ...next }));
  const toggleTag = (t: string) =>
    go({ tags: filters.tags.includes(t) ? filters.tags.filter((x) => x !== t) : [...filters.tags, t] });

  const { data: meta } = useQuery(async () => {
    const [categories, tags] = await Promise.all([fetchCategories(), fetchTagCounts()]);
    return { categories, tags };
  }, []);

  const key = toUrl(filters);
  const { data: articles, error, loading } = useQuery(async () => {
    const categories = meta?.categories ?? (await fetchCategories());
    const category = categories.find((c) => c.slug === filters.section);
    return fetchPublished({
      search: filters.q || undefined,
      tags: filters.tags,
      kind: filters.section === "board" ? "member" : category ? "magazine" : undefined,
      categoryId: category?.id,
      limit: 60,
    });
  }, [key]);

  const hasFilters = Boolean(filters.q || filters.tags.length || filters.section);
  const sections = [
    { slug: "", name: "Everything" },
    ...(meta?.categories ?? []).map((c) => ({ slug: c.slug, name: c.name })),
    { slug: "board", name: BOARD_NAME },
  ];

  return (
    <>
      <h1 className="page-heading">Search</h1>

      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          const raw = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          // Words starting with "#" become tag filters; the rest is a text search.
          const words = raw.split(/\s+/).filter(Boolean);
          const hashTags = normalizeTags(words.filter((w) => w.startsWith("#")).join(" "));
          const text = words.filter((w) => !w.startsWith("#")).join(" ");
          go({ q: text, tags: [...new Set([...filters.tags, ...hashTags])] });
        }}
      >
        <input key={filters.q} name="q" type="search" defaultValue={filters.q} placeholder="Search articles or type #tags" />
        <button type="submit">Search</button>
      </form>

      <div className="filters">
        <div className="filter-row" role="group" aria-label="Section">
          {sections.map((s) => (
            <button
              key={s.slug || "all"}
              type="button"
              className={`chip-filter ${filters.section === s.slug ? "on" : ""}`}
              onClick={() => go({ section: s.slug })}
            >
              {s.name}
            </button>
          ))}
        </div>

        {meta?.tags && meta.tags.length > 0 && (
          <div className="filter-row tag-cloud" role="group" aria-label="Tags">
            {meta.tags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                className={`chip-tag ${filters.tags.includes(tag) ? "on" : ""}`}
                aria-pressed={filters.tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                #{tag} <span className="chip-count">{count}</span>
              </button>
            ))}
          </div>
        )}

        {hasFilters && (
          <p className="filter-summary">
            {loading ? "Searching…" : `${articles?.length ?? 0} ${articles?.length === 1 ? "article" : "articles"}`}
            {filters.q && <> matching “{filters.q}”</>}
            {filters.tags.length > 0 && <> tagged {filters.tags.map((t) => `#${t}`).join(" + ")}</>}
            {" · "}
            <button type="button" className="link-button" onClick={() => router.push("/search/")}>
              Clear all
            </button>
          </p>
        )}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : articles?.length === 0 ? (
        <p className="muted">Nothing matches. Try removing a filter.</p>
      ) : (
        <div className="grid">
          {articles?.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </>
  );
}
