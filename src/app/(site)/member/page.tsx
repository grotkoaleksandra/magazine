"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Masonry } from "@/components/Masonry";
import { Avatar } from "@/components/Avatar";
import { ErrorNote, Loading } from "@/components/States";
import { fetchAuthor, fetchPublished } from "@/lib/data";
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
    const [author, posts] = await Promise.all([fetchAuthor(id), fetchPublished({ authorId: id, limit: 60 })]);
    return { author, posts };
  }, [id]);

  useEffect(() => {
    if (data?.author?.display_name) document.title = `${data.author.display_name} — ${site.name}`;
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!data?.author) return <h1 className="page-heading">Member not found</h1>;
  const { author, posts } = data;

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
      {posts.length === 0 ? (
        <p className="muted">No published posts yet.</p>
      ) : (
        <Masonry articles={posts} columns={[1, 2, 1]} />
      )}
    </>
  );
}
