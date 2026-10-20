"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LikeButton } from "@/components/LikeButton";
import type { ArticleWithMeta } from "@/lib/types";

// One story filling the whole screen: its video (or photo) behind a big title.
// Videos only play while they're on screen, to save battery and data.
export function StoryPanel({ article, likes }: { article: ArticleWithMeta; likes: number }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const href = `/article/?s=${article.slug}`;
  const type = article.category?.name ?? (article.video_url ? "Video" : "Story");

  return (
    <section className="story-panel">
      <Link href={href} className="story-panel-media" tabIndex={-1} aria-hidden>
        {article.video_url ? (
          <video
            ref={ref}
            src={article.video_url}
            poster={article.cover_image_url ?? undefined}
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          article.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.cover_image_url} alt="" loading="lazy" />
          )
        )}
      </Link>
      <div className="story-panel-text">
        <p className="story-panel-type">
          {article.video_url && <span className="story-panel-play">▶</span>}
          {type}
        </p>
        <h2 className="story-panel-title">
          <Link href={href}>{article.title}</Link>
        </h2>
        <div className="story-panel-actions">
          <Link href={href} className="btn btn-light">
            {article.video_url ? "Watch" : "Read"}
          </Link>
          <LikeButton articleId={article.id} count={likes} size="lg" />
        </div>
      </div>
    </section>
  );
}
