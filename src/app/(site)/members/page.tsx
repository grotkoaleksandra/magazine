"use client";

import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
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
          Writing from the Burn Yer Boats community. Every member can write for the board, and our editors pick the
          best for the front page.
        </p>
        <Link href="/admin/edit/" className="btn btn-primary">
          Write for the board
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
              <div className="grid grid-2">
                {data!.posts.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
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
