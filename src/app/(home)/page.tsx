"use client";

import Link from "next/link";
import { Masonry } from "@/components/Masonry";
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

  const shown = new Set(front.map((a) => a.id));
  const latest = magazine.filter((a) => !shown.has(a.id));

  return (
    <>
      <section className="home-section">
        <h2 className="section-heading">{featured.length > 0 ? "featured" : "latest"}</h2>
        <Masonry articles={front} columns={[1, 1, 2]} leadWide />
      </section>

      {latest.length > 0 && (
        <section className="home-section">
          <h2 className="section-heading">latest</h2>
          <Masonry articles={latest} columns={[2, 1, 1]} />
        </section>
      )}

      <section className="home-section board-strip">
        <div className="board-strip-head">
          <h2 className="section-heading">from the {BOARD_NAME.toLowerCase()}</h2>
          <Link href="/members/" className="btn">
            See the board
          </Link>
        </div>
        {board.length ? (
          <Masonry articles={board} columns={[1, 1, 1]} />
        ) : (
          <p className="muted">
            Members can write for the board. <Link href="/admin/?join=1">Join and write the first post →</Link>
          </p>
        )}
      </section>
    </>
  );
}
