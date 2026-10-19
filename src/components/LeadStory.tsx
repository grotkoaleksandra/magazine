import Link from "next/link";
import { Kicker } from "@/components/ArticleCard";
import type { ArticleWithMeta } from "@/lib/types";

// The newest featured article: a big photo with the headline in a box over its lower part (VICE-style).
export function LeadStory({ article }: { article: ArticleWithMeta }) {
  return (
    <article className="lead">
      <Link href={`/article/?s=${article.slug}`} className="lead-image" tabIndex={-1} aria-hidden>
        {article.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.cover_image_url} alt="" />
        )}
      </Link>
      <div className="lead-box">
        <Kicker article={article} />
        <h2 className="lead-title">
          <Link href={`/article/?s=${article.slug}`}>{article.title}</Link>
        </h2>
        {article.author?.display_name && (
          <p className="lead-byline">
            By <Link href={`/member/?id=${article.author.id}`}>{article.author.display_name}</Link>
          </p>
        )}
      </div>
    </article>
  );
}
