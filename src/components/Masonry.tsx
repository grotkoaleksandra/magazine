import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleWithMeta } from "@/lib/types";

// Image shapes cycle so columns end up different heights, like a printed spread.
const RATIOS = [4 / 5, 3 / 2, 1, 3 / 4, 16 / 10, 5 / 4];

// Irregular newspaper-style columns (e.g. narrow, narrow, wide) with vertical rules.
// Each article goes into whichever column is currently shortest, so heights stagger.
export function Masonry({
  articles,
  columns = [1, 1, 2],
  leadWide = false,
}: {
  articles: ArticleWithMeta[];
  columns?: number[];
  leadWide?: boolean;
}) {
  const total = columns.reduce((a, b) => a + b, 0);
  const cols: { article: ArticleWithMeta; ratio: number }[][] = columns.map(() => []);
  const heights = columns.map(() => 0);
  const widest = columns.indexOf(Math.max(...columns));

  articles.forEach((article, i) => {
    const ratio = RATIOS[(i * 7 + article.id) % RATIOS.length];
    let col = heights.indexOf(Math.min(...heights));
    if (i === 0 && leadWide) col = widest;
    const width = columns[col] / total;
    const imageHeight = article.cover_image_url ? width / ratio : 0;
    // Rough text height: headline + excerpt wrap more in narrow columns.
    const textHeight = (0.12 + (article.excerpt.length / 900) * (0.34 / width)) * 0.9;
    heights[col] += imageHeight + textHeight;
    cols[col].push({ article, ratio });
  });

  return (
    <div className="masonry" style={{ gridTemplateColumns: columns.map((c) => `${c}fr`).join(" ") }}>
      {cols.map((items, c) => (
        <div key={c} className={`masonry-col ${columns[c] === Math.max(...columns) && columns[c] > 1 ? "is-wide" : ""}`}>
          {items.map(({ article, ratio }) => (
            <ArticleCard key={article.id} article={article} ratio={ratio} />
          ))}
        </div>
      ))}
    </div>
  );
}
