"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ErrorNote, Loading } from "@/components/States";
import { fetchArticleBySlug, fetchLikeCounts } from "@/lib/data";
import { LikeButton } from "@/components/LikeButton";
import { Comments } from "@/components/Comments";
import { Byline, Kicker } from "@/components/ArticleCard";
import { statusLabel } from "@/lib/types";
import { Tags } from "@/components/Tags";
import { Related } from "@/components/Related";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { site } from "@/lib/site";
import { markSeen } from "@/lib/seen";
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
  const { data: likes } = useQuery(
    async () => (article ? (await fetchLikeCounts([article.id])).get(article.id) ?? 0 : 0),
    [article?.id],
  );

  useEffect(() => {
    if (!article) return;
    document.title = `${article.title} — ${site.name}`;
    if (article.status === "published") markSeen(article.id);
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
    <>
      {/* Video stories open with the film itself, full width, with sound and controls. */}
      {article.video_url && (
        <div className="story-video">
          <video src={article.video_url} poster={article.cover_image_url ?? undefined} controls playsInline autoPlay muted loop />
        </div>
      )}
      <article className="story">
        {article.status !== "published" && (
          <div className="draft-banner">
            {statusLabel[article.status]} — only you and the editors can see this.{" "}
            <Link href={`/admin/edit/?id=${article.id}`}>Edit</Link>
          </div>
        )}
        <header className="story-header">
          <Kicker article={article} />
          <h1 className="story-title">{article.title}</h1>
          {article.excerpt && <p className="story-dek">{article.excerpt}</p>}
          <Byline article={article} date={article.published_at ?? article.updated_at} />
          <div className="story-actions">
            <LikeButton articleId={article.id} count={likes ?? 0} size="lg" />
            <a href="#comments" className="btn">
              Comments
            </a>
          </div>
        </header>
        {!article.video_url && article.cover_image_url && (
          <figure className="story-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.cover_image_url} alt="" />
          </figure>
        )}
        <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.body) }} />
        {article.tags?.length > 0 && (
          <footer className="story-tags">
            <Tags tags={article.tags} />
          </footer>
        )}
        {article.status === "published" && <Comments articleId={article.id} />}
      </article>
      {article.status === "published" && <Related article={article} />}
    </>
  );
}