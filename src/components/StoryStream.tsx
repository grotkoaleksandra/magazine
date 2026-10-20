"use client";

import { Fragment } from "react";
import Link from "next/link";
import { IqPromo } from "@/components/IqPromo";
import { StoryPanel } from "@/components/StoryPanel";
import { fetchLikeCounts } from "@/lib/data";
import type { ArticleWithMeta } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

// One full-screen story after another, with the IQ test dropped in after the third.
export function StoryStream({ articles, promo = true }: { articles: ArticleWithMeta[]; promo?: boolean }) {
  const ids = articles.map((a) => a.id);
  const { data: likes } = useQuery(() => fetchLikeCounts(ids), [ids.join(",")]);

  return (
    <div className="stream">
      {articles.map((a, i) => (
        <Fragment key={a.id}>
          <StoryPanel article={a} likes={likes?.get(a.id) ?? 0} />
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
