import Link from "next/link";
import type { ArticleWithMeta } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Tags } from "@/components/Tags";

export function Kicker({ article }: { article: ArticleWithMeta }) {
  if (!article.category) return null;
  return (
    <Link href={`/category/?s=${article.category.slug}`} className="kicker">
      {article.video_url ? "▶ " : ""}
      {article.category.name}
    </Link>
  );
}

export function Byline({ article, date }: { article: ArticleWithMeta; date?: string | null }) {
  return (
    <p className="byline">
      {article.author?.display_name && (
        <>
          By <Link href={`/member/?id=${article.author.id}`}>{article.author.display_name}</Link> ·{" "}
        </>
      )}
      {formatDate(date ?? article.published_at)}
    </p>
  );
}

export function ArticleCard({
  article,
  size = "md",
  ratio,
}: {
  article: ArticleWithMeta;
  size?: "lg" | "md" | "sm";
  ratio?: number;
}) {
  return (
    <article className={`card card-${size}`}>
      {article.cover_image_url && size !== "sm" && (
        <Link href={`/article/?s=${article.slug}`} className="card-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover_image_url} alt="" loading="lazy" style={ratio ? { aspectRatio: ratio } : undefined} />
        </Link>
      )}
      <div className="card-body">
        <Kicker article={article} />
        <h2 className="card-title">
          <Link href={`/article/?s=${article.slug}`}>{article.title}</Link>
        </h2>
        {article.excerpt && size !== "sm" && <p className="card-excerpt">{article.excerpt}</p>}
        <Byline article={article} />
        {size !== "sm" && <Tags tags={article.tags} limit={3} />}
      </div>
    </article>
  );
}
