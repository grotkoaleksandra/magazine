import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { ArticleWithMeta } from "@/lib/types";

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*, category:categories(name, slug), author:authors(display_name)")
    .order("updated_at", { ascending: false });
  const articles = (data ?? []) as ArticleWithMeta[];

  return (
    <>
      <div className="admin-header">
        <h1>Articles</h1>
        <Link href="/admin/articles/new" className="btn btn-primary">
          + New article
        </Link>
      </div>
      {articles.length === 0 ? (
        <div className="panel empty-panel">
          <p>No articles yet.</p>
          <Link href="/admin/articles/new" className="btn btn-primary">
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
                    <Link href={`/admin/articles/${a.id}`} className="table-title">
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
