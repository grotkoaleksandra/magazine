"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { IqPromo } from "@/components/IqPromo";
import { StoryPanel } from "@/components/StoryPanel";
import { fetchLikeCounts } from "@/lib/data";
import type { ArticleWithMeta } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";
import { useSeen } from "@/lib/seen";

// One story after another. Stories this visitor hasn't seen come first; the ones they've
// already seen follow after a divider. The IQ test is dropped in after the third story.
export function StoryStream({ articles, promo = true }: { articles: ArticleWithMeta[]; promo?: boolean }) {
  const ids = articles.map((a) => a.id);
  const { data: likes } = useQuery(() => fetchLikeCounts(ids), [ids.join(",")]);
  const seenState = useSeen();

  // Decide the order once, when the page loads, so stories don't jump around while you scroll.
  // (seenState is a snapshot taken once on load; marking stories seen later doesn't change it.)
  const ordered = useMemo(() => {
    if (!seenState) return null;
    const unseen = articles.filter((a) => !seenState.seen.has(a.id));
    const seen = articles.filter((a) => seenState.seen.has(a.id));
    return { unseen, seen };
  }, [articles, seenState]);

  if (!ordered || !seenState) return <div className="stream" />;
  const isNew = (a: ArticleWithMeta) =>
    Boolean(seenState.previousVisit && a.published_at && a.published_at > seenState.previousVisit);
  const list = [...ordered.unseen, ...ordered.seen];

  return (
    <div className="stream">
      {list.map((a, i) => (
        <Fragment key={a.id}>
          {i === ordered.unseen.length && ordered.unseen.length > 0 && (
            <div className="seen-divider">
              <span>you&apos;ve already seen these</span>
            </div>
          )}
          {i === 0 && ordered.unseen.length === 0 && list.length > 0 && (
            <div className="seen-divider">
              <span>you&apos;re all caught up — here&apos;s everything again</span>
            </div>
          )}
          <StoryPanel article={a} likes={likes?.get(a.id) ?? 0} isNew={!seenState.seen.has(a.id) && isNew(a)} />
          {promo && i === 2 && (
            <section className="stream-promo">
              <IqPromo />
            </section>
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function JoinPanel() {
  return (
    <section className="join-panel">
      <p className="join-kicker">by the members, for the members, about the members</p>
      <h2 className="join-title">join us</h2>
      <div className="join-actions">
        <Link href="/admin/?join=1" className="btn btn-primary btn-big">
          Join
        </Link>
        <Link href="/manifesto/" className="btn btn-big">
          Read the manifesto
        </Link>
      </div>
    </section>
  );
}
