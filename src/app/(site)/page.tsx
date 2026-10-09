import { ArticleCard } from "@/components/ArticleCard";
import { getPublishedArticles } from "@/lib/articles";

export default async function HomePage() {
  const articles = await getPublishedArticles({ limit: 40 });

  if (articles.length === 0) {
    return (
      <div className="empty">
        <h1>The first issue is on its way.</h1>
        <p>No articles have been published yet.</p>
      </div>
    );
  }

  const lead = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a.id !== lead.id);
  const secondary = rest.slice(0, 3);
  const latest = rest.slice(3);

  return (
    <>
      <section className="front">
        <div className="front-lead">
          <ArticleCard article={lead} size="lg" />
        </div>
        {secondary.length > 0 && (
          <div className="front-side">
            {secondary.map((a) => (
              <ArticleCard key={a.id} article={a} size="sm" />
            ))}
          </div>
        )}
      </section>
      {latest.length > 0 && (
        <section>
          <h2 className="section-heading">Latest</h2>
          <div className="grid">
            {latest.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
