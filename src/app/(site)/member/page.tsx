"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Masonry } from "@/components/Masonry";
import { Avatar } from "@/components/Avatar";
import { ErrorNote, Loading } from "@/components/States";
import { fetchAuthor, fetchListings, fetchPublished } from "@/lib/data";
import Link from "next/link";
import { listingKinds } from "@/lib/types";
import { site } from "@/lib/site";
import { useQuery } from "@/lib/useQuery";

export default function MemberPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Member />
    </Suspense>
  );
}

const roleLabel = { admin: "Editor-in-chief", editor: "Editor", member: "Member" } as const;

function Member() {
  const id = useSearchParams().get("id") ?? "";
  const { data, error, loading } = useQuery(async () => {
    const [author, posts, listings] = await Promise.all([
      fetchAuthor(id),
      fetchPublished({ authorId: id, limit: 60 }),
      fetchListings({ authorId: id }).then((l) => l.filter((x) => x.status === "approved")),
    ]);
    return { author, posts, listings };
  }, [id]);

  useEffect(() => {
    if (data?.author?.display_name) document.title = `${data.author.display_name} — ${site.name}`;
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!data?.author) return <h1 className="page-heading">Member not found</h1>;
  const { author, posts, listings } = data;

  return (
    <>
      <header className="profile-header">
        <Avatar name={author.display_name} url={author.avatar_url} size={96} />
        <div>
          <span className="kicker">{roleLabel[author.role]}</span>
          <h1 className="page-heading">{author.display_name}</h1>
          {author.bio && <p className="profile-bio">{author.bio}</p>}
        </div>
      </header>
      {posts.length > 0 && (
        <>
          <h2 className="section-heading">stories</h2>
          <Masonry articles={posts} columns={[1, 2, 1]} />
        </>
      )}
      {listings.length > 0 && (
        <>
          <h2 className="section-heading">in the marketplace</h2>
          <ul className="profile-listings">
            {listings.map((l) => (
              <li key={l.id}>
                <Link href="/marketplace/">
                  <span className="listing-kind">{listingKinds[l.kind]}</span> {l.title}
                  {l.price && <span className="listing-price">{l.price}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {posts.length === 0 && listings.length === 0 && <p className="muted big-note">Nothing here yet.</p>}
    </>
  );
}
