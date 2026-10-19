import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleWithMeta } from "@/lib/types";

// A VICE-style section block: "See all", big heading, heavy rule, three newest pieces in a row.
export function CategoryRow({
  title,
  href,
  articles,
  intro,
}: {
  title: string;
  href: string;
  articles: ArticleWithMeta[];
  intro?: React.ReactNode;
}) {
  if (!articles.length && !intro) return null;
  return (
    <section className="cat-row">
      <Link href={href} className="cat-see-all">
        See all
      </Link>
      <h2 className="cat-heading">
        <Link href={href}>{title}</Link>
      </h2>
      {intro && <div className="cat-intro">{intro}</div>}
      <div className="cat-grid">
        {articles.slice(0, 3).map((a) => (
          <ArticleCard key={a.id} article={a} ratio={16 / 9} />
        ))}
      </div>
    </section>
  );
}
