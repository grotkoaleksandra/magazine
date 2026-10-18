"use client";

import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Hero } from "@/components/Hero";
import { SectionNav } from "@/components/SiteHeader";
import { ErrorNote, Loading } from "@/components/States";
import { BOARD_NAME, fetchPublished } from "@/lib/data";
import { fetchSettings, type SiteSettings } from "@/lib/settings";
import { useQuery } from "@/lib/useQuery";

export default function HomePage() {
  const { data, error, loading } = useQuery(async () => {
    const [settings, featured, magazine, board] = await Promise.all([
      fetchSettings().catch((): SiteSettings => ({})),
      fetchPublished({ featured: true, limit: 10 }),
      fetchPublished({ kind: "magazine", limit: 40 }),
      fetchPublished({ kind: "member", limit: 3 }),
    ]);
    return { settings, featured, magazine, board };
  }, []);

  return (
    <>
      <Hero videoUrl={data?.settings.hero_video_url || undefined} ready={!loading} />
      <SectionNav sticky />
      <main className="container site-main">
        {loading ? <Loading /> : error ? <ErrorNote error={error} /> : <FrontPage {...data!} />}
      </main>
    </>
  );
}

function FrontPage({
  featured,
  magazine,
  board,
}: {
  featured: Awaited<ReturnType<typeof fetchPublished>>;
  magazine: Awaited<ReturnType<typeof fetchPublished>>;
  board: Awaited<ReturnType<typeof fetchPublished>>;
}) {
  // Featured articles lead the page; without any, fall back to the newest piece.
  const front = featured.length ? featured : magazine.slice(0, 1);
  if (!front.length && !board.length) {
    return (
      <div className="empty">
        <h2>The first issue is on its way.</h2>
        <p>No articles have been published yet.</p>
      </div>
    );
  }

  const [lead, ...moreFeatured] = front;
  const side = moreFeatured.slice(0, 3);
  const featuredGrid = moreFeatured.slice(3);
  const shown = new Set(front.map((a) => a.id));
  const latest = magazine.filter((a) => !shown.has(a.id));

  return (
    <>
      {lead && (
        <section className="front">
          <div className="front-lead">
            {featured.length > 0 && <h2 className="eyebrow">Featured</h2>}
            <ArticleCard article={lead} size="lg" />
          </div>
          {side.length > 0 && (
            <div className="front-side">
              {side.map((a) => (
                <ArticleCard key={a.id} article={a} size="sm" />
              ))}
            </div>
          )}
        </section>
      )}

      {featuredGrid.length > 0 && (
        <section className="home-section">
          <h2 className="section-heading">More featured</h2>
          <div className="grid">
            {featuredGrid.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="home-section">
          <h2 className="section-heading">Latest</h2>
          <div className="grid">
            {latest.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      <section className="home-section board-strip">
        <div className="board-strip-head">
          <h2 className="section-heading">From the {BOARD_NAME}</h2>
          <Link href="/members/" className="btn">
            See the board
          </Link>
        </div>
        {board.length ? (
          <div className="grid">
            {board.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <p className="muted">
            Members can write for the board. <Link href="/admin/">Join and write the first post →</Link>
          </p>
        )}
      </section>
    </>
  );
}
