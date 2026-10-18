"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ErrorNote, Loading } from "@/components/States";
import { fetchArticleBySlug } from "@/lib/data";
import { formatDate, readingTime } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { site } from "@/lib/site";
import { useQuery } from "@/lib/useQuery";

export default function ArticlePage() {
  return (
    <Suspense fallback={<Loading />}>
      <Article />
    </Suspense>
  );
}

function Article() {
  const slug = useSearchParams().get("s") ?? "";
  const { data: article, error, loading } = useQuery(() => fetchArticleBySlug(slug), [slug]);

  useEffect(() => {
    if (article) document.title = `${article.title} — ${site.name}`;
  }, [article]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!article) {
    return (
      <div className="empty">
        <h1>Article not found</h1>
        <p>
          <Link href="/">Back to the front page</Link>
        </p>
      </div>
    );
  }

  return (
    <article className="story">
      {article.status === "draft" && (
        <div className="draft-banner">
          Draft preview — only staff can see this. <Link href={`/admin/edit/?id=${article.id}`}>Edit</Link>
        </div>
      )}
      <header className="story-header">
        {article.category && (
          <Link href={`/category/?s=${article.category.slug}`} className="kicker">
            {article.category.name}
          </Link>
        )}
        <h1 className="story-title">{article.title}</h1>
        {article.excerpt && <p className="story-dek">{article.excerpt}</p>}
        <p className="byline">
          {article.author?.display_name && <>By {article.author.display_name} · </>}
          {formatDate(article.published_at ?? article.updated_at)} · {readingTime(article.body)} min read
        </p>
      </header>
      {article.cover_image_url && (
        <figure className="story-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover_image_url} alt="" />
        </figure>
      )}
      <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.body) }} />
    </article>
  );
}
