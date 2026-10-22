"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LikeButton } from "@/components/LikeButton";
import type { ArticleWithMeta } from "@/lib/types";

// One story: a big video (or photo) with the headline in a box over its lower part.
export function StoryPanel({ article, likes }: { article: ArticleWithMeta; likes: number }) {
  const ref = useRef<HTMLVideoElement>(null);

  // Desktop: the video plays while the mouse is over the card. Touch screens can't hover,
  // so there it plays while the card is on screen.
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(hover: hover)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.6 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const hoverPlay = () => ref.current?.play().catch(() => {});
  const hoverPause = () => ref.current?.pause();

  const href = `/article/?s=${article.slug}`;
  const type = article.category?.name ?? (article.video_url ? "Video" : "Story");

  return (
    <article className="story-card" onMouseEnter={hoverPlay} onMouseLeave={hoverPause}>
      <Link href={href} className="story-card-media" tabIndex={-1} aria-hidden>
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
      {/* Headline box over the lower part of the picture, dark text on light, easy to read. */}
      <div className="story-card-box">
        <p className="story-card-type">
          {article.video_url && <span aria-hidden>▶ </span>}
          {type}
        </p>
        <h2 className="story-card-title">
          <Link href={href}>{article.title}</Link>
        </h2>
        <div className="story-card-foot">
          {article.author?.display_name && (
            <p className="story-card-byline">
              By <Link href={`/member/?id=${article.author.id}`}>{article.author.display_name}</Link>
            </p>
          )}
          <LikeButton articleId={article.id} count={likes} />
        </div>
      </div>
    </article>
  );
}