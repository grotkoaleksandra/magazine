"use client";

import Link from "next/link";
import { Masonry } from "@/components/Masonry";
import { Avatar } from "@/components/Avatar";
import { ErrorNote, Loading } from "@/components/States";
import { BOARD_NAME, fetchContributors, fetchPublished } from "@/lib/data";
import { useQuery } from "@/lib/useQuery";

export default function MembersBoardPage() {
  const { data, error, loading } = useQuery(async () => {
    const [posts, contributors] = await Promise.all([fetchPublished({ kind: "member", limit: 60 }), fetchContributors()]);
    return { posts, contributors };
  }, []);

  return (
    <>
      <header className="board-header">
        <h1 className="page-heading">{BOARD_NAME}</h1>
        <p className="board-intro">
          The part of Burn Yer Boats written by readers, not by us. Anyone can join, write a post about whatever they
          like (with photos), and send it in. Our editors read everything, publish the best here, and now and then
          one makes it onto the front page.
        </p>
        <Link href="/admin/?join=1" className="btn btn-primary">
          Become a member to contribute
        </Link>
      </header>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : (
        <div className="board">
          <div>
            {data!.posts.length === 0 ? (
              <p className="muted">No member posts yet. Be the first.</p>
            ) : (
              <Masonry articles={data!.posts} columns={[1, 1]} />
            )}
          </div>
          {data!.contributors.length > 0 && (
            <aside className="contributors">
              <h2 className="side-heading">Contributors</h2>
              <ul>
                {data!.contributors.map((c) => (
                  <li key={c.id}>
                    <Link href={`/member/?id=${c.id}`}>
                      <Avatar name={c.display_name} url={c.avatar_url} size={36} />
                      <span>
                        <strong>{c.display_name}</strong>
                        <span className="muted">
                          {c.posts} {c.posts === 1 ? "post" : "posts"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      )}
    </>
  );
}
