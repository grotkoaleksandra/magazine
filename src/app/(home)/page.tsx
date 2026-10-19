"use client";

import Link from "next/link";
import { Masonry } from "@/components/Masonry";
import { LatestList } from "@/components/LatestList";
import { LeadStory } from "@/components/LeadStory";
import { IqPromo } from "@/components/IqPromo";
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

  // Newest featured leads; every other featured piece sits underneath it, so when a new
  // article is featured the previous lead simply drops into the list below.
  const [lead, ...moreFeatured] = front;
  const shown = new Set(front.map((a) => a.id));
  const latest = [...magazine, ...board]
    .filter((a) => !shown.has(a.id))
    .sort((x, y) => (y.published_at ?? "").localeCompare(x.published_at ?? ""));

  return (
    <>
      {lead && (
        <section className="front-top">
          <div className="front-main">
            <LeadStory article={lead} />
            {moreFeatured.length > 0 && (
              <div className="front-more">
                <Masonry articles={moreFeatured} columns={[1, 1]} />
              </div>
            )}
            <div className="front-promo">
              <IqPromo />
            </div>
          </div>
          {latest.length > 0 && (
            <aside className="front-rail">
              <div className="rail-latest">
                <h2 className="rail-heading">the latest</h2>
                <LatestList articles={latest.slice(0, 10)} single />
              </div>
            </aside>
          )}
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
      <CategoryRow
        title={BOARD_NAME}
        href="/members/"
        articles={board}
        intro={
          <>
            <p>
              The {BOARD_NAME} is the part of Burn Yer Boats written by readers, not by us. Anyone can join, write a
              post about whatever they like (with photos), and send it in. Our editors read everything, publish the
              best here, and now and then one makes it onto the front page.
            </p>
            <Link href="/admin/?join=1" className="btn btn-primary">
              Become a member to contribute
            </Link>
          </>
        }
      />
    </>
  );
}
