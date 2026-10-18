"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStaff } from "@/components/admin/AdminShell";
import { ErrorNote, Loading } from "@/components/States";
import { ARTICLE_SELECT, BOARD_NAME } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { statusLabel, type ArticleWithMeta } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

const TABS = [
  { key: "all", label: "All" },
  { key: "review", label: "Awaiting review" },
  { key: "magazine", label: "Magazine" },
  { key: "board", label: BOARD_NAME },
  { key: "featured", label: "Featured" },
] as const;

export default function ArticlesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Articles />
    </Suspense>
  );
}

function Articles() {
  const { user, staff } = useStaff();
  const tab = useSearchParams().get("tab") ?? "all";

  const { data, error, loading } = useQuery(async () => {
    let q = supabase.from("articles").select(ARTICLE_SELECT).order("updated_at", { ascending: false });
    if (!staff) q = q.eq("author_id", user.id);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as ArticleWithMeta[];
  }, [staff, user.id]);

  const all = data ?? [];
  const reviewCount = all.filter((a) => a.status === "pending").length;
  const articles = !staff
    ? all
    : all.filter((a) =>
        tab === "review" ? a.status === "pending"
        : tab === "magazine" ? a.kind === "magazine"
        : tab === "board" ? a.kind === "member"
        : tab === "featured" ? a.featured
        : true,
      );

  return (
    <>
      <div className="admin-header">
        <h1>{staff ? "Articles" : "My posts"}</h1>
        <Link href="/admin/edit/" className="btn btn-primary">
          + {staff ? "New article" : "Write a post"}
        </Link>
      </div>

      {!staff && (
        <p className="muted">
          Your posts appear on the {BOARD_NAME} once an editor approves them. Write a draft, then click{" "}
          <strong>Submit for review</strong>.
        </p>
      )}

      {staff && (
        <div className="tabs">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin/?tab=${t.key}`} className={`tab ${tab === t.key ? "tab-on" : ""}`}>
              {t.label}
              {t.key === "review" && reviewCount > 0 && <span className="count">{reviewCount}</span>}
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
          <p>{tab === "review" ? "Nothing waiting for review." : "No posts here yet."}</p>
          <Link href="/admin/edit/" className="btn btn-primary">
            {staff ? "Write an article" : "Write your first post"}
          </Link>
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Where</th>
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
                  <td>{a.kind === "member" ? BOARD_NAME : (a.category?.name ?? "Magazine")}</td>
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
