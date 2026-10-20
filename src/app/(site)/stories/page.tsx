"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorNote, Loading } from "@/components/States";
import { StoryStream } from "@/components/StoryStream";
import { VIEWS, fetchPublished, type View } from "@/lib/data";
import { site } from "@/lib/site";
import { useQuery } from "@/lib/useQuery";

export default function StoriesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Stories />
    </Suspense>
  );
}

function Stories() {
  const raw = useSearchParams().get("view") ?? "videos";
  const view = (raw in VIEWS ? raw : "videos") as View;
  const { data, error, loading } = useQuery(async () => (await fetchPublished({ limit: 60 })).filter(VIEWS[view].test), [view]);

  useEffect(() => {
    document.title = `${VIEWS[view].title} — ${site.name}`;
  }, [view]);

  return (
    <>
      <h1 className="page-heading">{VIEWS[view].title}</h1>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : data!.length === 0 ? (
        <p className="muted big-note">Nothing here yet.</p>
      ) : (
        <div className="stream-bleed">
          <StoryStream articles={data!} promo={false} />
        </div>
      )}
    </>
  );
}
