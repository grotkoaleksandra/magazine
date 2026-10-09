import Link from "next/link";
import type { ArticleWithMeta } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function ArticleCard({ article, size = "md" }: { article: ArticleWithMeta; size?: "lg" | "md" | "sm" }) {
  return (
    <article className={`card card-${size}`}>
      {article.cover_image_url && size !== "sm" && (
        <Link href={`/article/${article.slug}`} className="card-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover_image_url} alt="" loading="lazy" />
        </Link>
      )}
      <div className="card-body">
        {article.category && (
          <Link href={`/category/${article.category.slug}`} className="kicker">
            {article.category.name}
          </Link>
        )}
        <h2 className="card-title">
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h2>
        {article.excerpt && size !== "sm" && <p className="card-excerpt">{article.excerpt}</p>}
        <p className="byline">
          {article.author?.display_name && <>By {article.author.display_name} · </>}
          {formatDate(article.published_at)}
        </p>
      </div>
    </article>
  );
}
