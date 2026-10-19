"use client";

import Link from "next/link";
import { Masonry } from "@/components/Masonry";
import { fetchRelated } from "@/lib/data";
import type { ArticleWithMeta } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export function Related({ article }: { article: ArticleWithMeta }) {
  const { data } = useQuery(() => fetchRelated(article), [article.id]);
  if (!data?.articles.length) return null;

  return (
    <section className="related">
      <div className="related-head">
        <h2 className="section-heading">{data.topTag ? <>more #{data.topTag}</> : "more like this"}</h2>
        {data.topTag && (
          <Link href={`/search/?tag=${encodeURIComponent(data.topTag)}`} className="btn">
            Everything #{data.topTag}
          </Link>
        )}
      </div>
      <Masonry articles={data.articles} columns={[1, 2, 1]} />
    </section>
  );
}
