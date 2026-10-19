"use client";

import Link from "next/link";
import { Masonry } from "@/components/Masonry";
import { LatestList } from "@/components/LatestList";
import { LeadStory } from "@/components/LeadStory";
import { ArticleCard } from "@/components/ArticleCard";
import { Hero } from "@/components/Hero";
import { SectionNav } from "@/components/SiteHeader";
import { ErrorNote, Loading } from "@/components/States";
import { BOARD_NAME, fetchCategories, fetchPublished } from "@/lib/data";
import { CategoryRow } from "@/components/CategoryRow";
import type { Category } from "@/lib/types";
import { fetchSettings, type SiteSettings } from "@/lib/settings";
import { useQuery } from "@/lib/useQuery";

export default function HomePage() {
  const { data, error, loading } = useQuery(async () => {
    const [settings, featured, magazine, board, categories] = await Promise.all([
      fetchSettings().catch((): SiteSettings => ({})),
      fetchPublished({ featured: true, limit: 10 }),
      fetchPublished({ kind: "magazine", limit: 60 }),
      fetchPublished({ kind: "member", limit: 3 }),
      fetchCategories(),
    ]);
    return { settings, featured, magazine, board, categories };
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
  categories,
}: {
  featured: Awaited<ReturnType<typeof fetchPublished>>;
  magazine: Awaited<ReturnType<typeof fetchPublished>>;
  board: Awaited<ReturnType<typeof fetchPublished>>;
  categories: Category[];
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

  const [lead, second, ...moreFeatured] = front;
  const shown = new Set(front.map((a) => a.id));
  const latest = [...magazine, ...board]
    .filter((a) => !shown.has(a.id))
    .sort((x, y) => (y.published_at ?? "").localeCompare(x.published_at ?? ""));

  return (
    <>
      {lead && (
        <section className="front-top">
          <LeadStory article={lead} />
          <aside className="front-rail">
            {second && <ArticleCard article={second} ratio={16 / 10} />}
            {latest.length > 0 && (
              <div className="rail-latest">
                <h2 className="rail-heading">the latest</h2>
                <LatestList articles={latest.slice(0, 6)} single />
              </div>
            )}
          </aside>
        </section>
      )}

      {moreFeatured.length > 0 && (
        <section className="home-section">
          <h2 className="section-heading">featured</h2>
          <Masonry articles={moreFeatured} columns={[1, 1, 2]} leadWide />
        </section>
      )}

      {/* One block per section, newest three each (VICE-style). */}
      {categories.map((c) => (
        <CategoryRow
          key={c.id}
          title={c.name}
          href={`/category/?s=${c.slug}`}
          articles={magazine.filter((a) => a.category?.slug === c.slug)}
        />
      ))}
      {board.length ? (
        <CategoryRow title={BOARD_NAME} href="/members/" articles={board} />
      ) : (
        <p className="muted">
          Members can write for the {BOARD_NAME}. <Link href="/admin/?join=1">Join and write the first post →</Link>
        </p>
      )}
    </>
  );
}
