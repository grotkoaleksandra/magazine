"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { ErrorNote, Loading } from "@/components/States";
import { fetchListings } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { listingKinds, type ListingKind } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";
import { useSession } from "@/lib/useSession";

export default function MarketplacePage() {
  const session = useSession();
  const { data, error, loading } = useQuery(() => fetchListings(), []);
  const [kind, setKind] = useState<ListingKind | "">("");
  const listings = (data ?? []).filter((l) => !kind || l.kind === kind);

  return (
    <>
      <div className="market-head">
        <h1 className="page-heading">marketplace</h1>
        <Link href={session.status === "signed-in" ? "/marketplace/new/" : "/admin/?join=1"} className="btn btn-primary btn-big">
          + Post something
        </Link>
      </div>
      <p className="big-note muted">Selling, renting, teaching, throwing a party? Post it for the members.</p>

      <div className="filter-row market-filters">
        <button type="button" className={`chip-filter ${kind === "" ? "on" : ""}`} onClick={() => setKind("")}>
          Everything
        </button>
        {(Object.keys(listingKinds) as ListingKind[]).map((k) => (
          <button key={k} type="button" className={`chip-filter ${kind === k ? "on" : ""}`} onClick={() => setKind(k)}>
            {listingKinds[k]}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : listings.length === 0 ? (
        <p className="big-note muted">Nothing posted yet. Be the first.</p>
      ) : (
        <div className="market-grid">
          {listings.map((l) => (
            <article key={l.id} className="listing">
              {l.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image_url} alt="" className="listing-image" loading="lazy" />
              )}
              <div className="listing-body">
                <p className="listing-kind">
                  {listingKinds[l.kind]}
                  {l.price && <span className="listing-price">{l.price}</span>}
                </p>
                <h2 className="listing-title">{l.title}</h2>
                {l.body && <p className="listing-text">{l.body}</p>}
                {l.location && <p className="listing-meta">📍 {l.location}</p>}
                {l.contact && <p className="listing-meta">✉ {l.contact}</p>}
                <Link href={`/member/?id=${l.author_id}`} className="listing-author">
                  <Avatar name={l.author?.display_name ?? null} url={l.author?.avatar_url ?? null} size={28} />
                  <span>{l.author?.display_name}</span>
                  <span className="muted">· {timeAgo(l.created_at)}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
