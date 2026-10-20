"use client";

import { Hero } from "@/components/Hero";
import { SectionNav } from "@/components/SiteHeader";
import { ErrorNote, Loading } from "@/components/States";
import { JoinPanel, StoryStream } from "@/components/StoryStream";
import { fetchPublished } from "@/lib/data";
import { fetchSettings, type SiteSettings } from "@/lib/settings";
import { useQuery } from "@/lib/useQuery";

export default function HomePage() {
  const { data, error, loading } = useQuery(async () => {
    const [settings, stories] = await Promise.all([
      fetchSettings().catch((): SiteSettings => ({})),
      fetchPublished({ limit: 30 }),
    ]);
    // Featured stories first (newest featured on top), then everything else, newest first.
    const ordered = [...stories.filter((a) => a.featured), ...stories.filter((a) => !a.featured)];
    return { settings, stories: ordered };
  }, []);

  return (
    <>
      <Hero videoUrl={data?.settings.hero_video_url || undefined} ready={!loading} />
      <SectionNav sticky />
      {loading ? (
        <main className="container site-main">
          <Loading />
        </main>
      ) : error ? (
        <main className="container site-main">
          <ErrorNote error={error} />
        </main>
      ) : (
        <main>
          <StoryStream articles={data!.stories} />
          <JoinPanel />
        </main>
      )}
    </>
  );
}
