"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStaff } from "@/components/admin/AdminShell";
import { ErrorNote, Loading } from "@/components/States";
import { ARTICLE_SELECT } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { statusLabel, type ArticleWithMeta } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

const TABS = [
  { key: "all", label: "All" },
  { key: "videos", label: "Videos" },
  { key: "featured", label: "Featured" },
  { key: "drafts", label: "Drafts" },
] as const;

export default function ArticlesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Articles />
    </Suspense>
  );
}

function Articles() {
  const { user, staff, profile } = useStaff();
  const tab = useSearchParams().get("tab") ?? "all";

  const { data, error, loading } = useQuery(async () => {
    let q = supabase.from("articles").select(ARTICLE_SELECT).order("updated_at", { ascending: false });
    if (!staff) q = q.eq("author_id", user.id);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as ArticleWithMeta[];
  }, [staff, user.id]);

  const all = data ?? [];
  const articles = all.filter((a) =>
    tab === "videos" ? Boolean(a.video_url) : tab === "featured" ? a.featured : tab === "drafts" ? a.status !== "published" : true,
  );

  // Members don't write stories: their dashboard is a simple welcome.
  if (!staff) return <MemberHome name={profile.display_name} />;

  return (
    <>
      <div className="admin-header">
        <h1>stories</h1>
        <Link href="/admin/edit/" className="btn btn-primary">
          + New story
        </Link>
      </div>


      {staff && (
        <div className="tabs">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin/?tab=${t.key}`} className={`tab ${tab === t.key ? "tab-on" : ""}`}>
              {t.label}
            </Link>
          ))}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : articles.length === 0 ? (
        <div className="panel empty-panel">
          <p>No stories here yet.</p>
          <Link href="/admin/edit/" className="btn btn-primary">
            Write a story
          </Link>
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                {staff && <th>Author</th>}
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/edit/?id=${a.id}`} className="table-title">
                      {a.title}
                    </Link>
                    {a.featured && <span className="tag tag-feature">Featured</span>}
                  </td>
                  <td>{a.video_url ? "▶ " : ""}{a.category?.name ?? "—"}</td>
                  {staff && <td>{a.author?.display_name ?? "—"}</td>}
                  <td>
                    <span className={`tag tag-${a.status}`}>{statusLabel[a.status]}</span>
                  </td>
                  <td className="muted">{formatDate(a.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function MemberHome({ name }: { name: string | null }) {
  return (
    <>
      <div className="admin-header">
        <h1>hi{name ? `, ${name}` : ""}</h1>
      </div>
      <div className="member-home">
        <Link href="/admin/profile/" className="panel member-tile">
          <strong>Your profile</strong>
          <span className="muted">Add a photo and a few words about you.</span>
        </Link>
        <Link href="/marketplace/new/" className="panel member-tile">
          <strong>Post in the marketplace</strong>
          <span className="muted">Selling, renting, teaching, throwing a party.</span>
        </Link>
        <Link href="/" className="panel member-tile">
          <strong>Watch &amp; read</strong>
          <span className="muted">Like stories and join the conversation underneath.</span>
        </Link>
      </div>
    </>
  );
}
