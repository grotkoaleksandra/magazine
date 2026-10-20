"use client";

import Link from "next/link";
import { useState } from "react";
import { useStaff } from "@/components/admin/AdminShell";
import { ErrorNote, Loading } from "@/components/States";
import { moderateComment, updateComment } from "@/lib/admin";
import { timeAgo } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Comment } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

async function fetchAllComments() {
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:authors!comments_author_id_fkey(id, display_name, avatar_url), article:articles(title, slug)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as Comment[];
}

export default function CommentsAdminPage() {
  const { staff } = useStaff();
  const { data, error, loading, reload } = useQuery(fetchAllComments, []);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [editing, setEditing] = useState<number | null>(null);

  if (!staff) return <p className="muted">Only editors can moderate comments.</p>;
  const all = data ?? [];
  const list = all.filter((c) => c.status === tab);
  const pendingCount = all.filter((c) => c.status === "pending").length;

  return (
    <>
      <div className="admin-header">
        <h1>comments</h1>
      </div>
      <p className="muted">Comments stay hidden until you approve them. You can edit or delete any comment.</p>
      <div className="tabs">
        <button className={`tab ${tab === "pending" ? "tab-on" : ""}`} onClick={() => setTab("pending")}>
          Waiting {pendingCount > 0 && <span className="count">{pendingCount}</span>}
        </button>
        <button className={`tab ${tab === "approved" ? "tab-on" : ""}`} onClick={() => setTab("approved")}>
          Approved
        </button>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : list.length === 0 ? (
        <div className="panel empty-panel">
          <p>{tab === "pending" ? "Nothing waiting. All caught up." : "No approved comments yet."}</p>
        </div>
      ) : (
        <div className="panel">
          <ul className="mod-list">
            {list.map((c) => (
              <li key={c.id}>
                <p className="mod-meta">
                  <strong>{c.author?.display_name ?? "member"}</strong> on{" "}
                  <Link href={`/article/?s=${c.article?.slug}`} target="_blank">
                    {c.article?.title}
                  </Link>{" "}
                  · {timeAgo(c.created_at)}
                </p>
                {editing === c.id ? (
                  <form
                    className="mod-edit"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await updateComment(c.id, String(new FormData(e.currentTarget).get("body") ?? ""));
                      setEditing(null);
                      reload();
                    }}
                  >
                    <textarea name="body" defaultValue={c.body} rows={3} />
                    <button className="btn btn-primary">Save</button>
                    <button type="button" className="link-button" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <p className="mod-body">{c.body}</p>
                )}
                <div className="mod-actions">
                  {c.status === "pending" && (
                    <button className="btn btn-primary" onClick={async () => (await moderateComment(c.id, "approve"), reload())}>
                      Approve
                    </button>
                  )}
                  <button className="btn" onClick={() => setEditing(c.id)}>
                    Edit
                  </button>
                  <button
                    className="link-button danger"
                    onClick={async () => {
                      if (confirm("Delete this comment?")) {
                        await moderateComment(c.id, "delete");
                        reload();
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
