import Link from "next/link";
import { timeAgo } from "@/lib/format";
import type { ArticleWithMeta } from "@/lib/types";

// Compact "the latest" rail (à la VICE): small square photo, time, headline.
export function LatestList({ articles, single = false }: { articles: ArticleWithMeta[]; single?: boolean }) {
  return (
    <ol className={`latest-list ${single ? "latest-single" : ""}`}>
      {articles.map((a) => (
        <li key={a.id}>
          <Link href={`/article/?s=${a.slug}`} className="latest-item">
            <span className="latest-thumb">
              {a.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.cover_image_url} alt="" loading="lazy" />
              )}
            </span>
            <span className="latest-text">
              <span className="latest-time">{timeAgo(a.published_at)}</span>
              <span className="latest-title">{a.title}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
