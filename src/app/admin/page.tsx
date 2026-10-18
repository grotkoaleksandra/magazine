"use client";

import Link from "next/link";
import { ErrorNote, Loading } from "@/components/States";
import { ARTICLE_SELECT } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { ArticleWithMeta } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

async function fetchAll() {
  const { data, error } = await supabase.from("articles").select(ARTICLE_SELECT).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ArticleWithMeta[];
}

export default function AdminArticlesPage() {
  const { data: articles, error, loading } = useQuery(fetchAll, []);

  return (
    <>
      <div className="admin-header">
        <h1>Articles</h1>
        <Link href="/admin/edit/" className="btn btn-primary">
          + New article
        </Link>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : !articles?.length ? (
        <div className="panel empty-panel">
          <p>No articles yet.</p>
          <Link href="/admin/edit/" className="btn btn-primary">
            Write your first article
          </Link>
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Section</th>
                <th>Author</th>
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
                    {a.featured && <span className="tag tag-feature">Lead story</span>}
                  </td>
                  <td>{a.category?.name ?? "—"}</td>
                  <td>{a.author?.display_name ?? "—"}</td>
                  <td>
                    <span className={`tag tag-${a.status}`}>{a.status === "published" ? "Published" : "Draft"}</span>
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
