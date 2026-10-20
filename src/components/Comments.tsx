"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { addComment, moderateComment } from "@/lib/admin";
import { fetchComments } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { isStaffRole } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";
import { useSession } from "@/lib/useSession";

// Conversation under a story. New comments wait for an editor's approval.
export function Comments({ articleId }: { articleId: number }) {
  const session = useSession();
  const me = session.status === "signed-in" ? session.profile : null;
  const staff = isStaffRole(me?.role);
  const { data: comments, reload } = useQuery(() => fetchComments(articleId), [articleId, me?.id]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ error?: string; message?: string }>({});

  const visible = comments ?? [];

  return (
    <section className="comments" id="comments">
      <h2 className="comments-heading">conversation</h2>

      {visible.length === 0 && <p className="muted">No comments yet. Start the conversation.</p>}
      <ul className="comment-list">
        {visible.map((c) => (
          <li key={c.id} className={`comment ${c.status === "pending" ? "is-pending" : ""}`}>
            <Link href={`/member/?id=${c.author_id}`} className="comment-avatar">
              <Avatar name={c.author?.display_name ?? null} url={c.author?.avatar_url ?? null} size={44} />
            </Link>
            <div>
              <p className="comment-meta">
                <Link href={`/member/?id=${c.author_id}`}>{c.author?.display_name ?? "member"}</Link> · {timeAgo(c.created_at)}
                {c.status === "pending" && <span className="tag tag-pending">waiting for approval</span>}
              </p>
              <p className="comment-body">{c.body}</p>
              {(staff || c.author_id === me?.id) && (
                <div className="comment-actions">
                  {staff && c.status === "pending" && (
                    <button className="link-button" onClick={async () => (await moderateComment(c.id, "approve"), reload())}>
                      Approve
                    </button>
                  )}
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
              )}
            </div>
          </li>
        ))}
      </ul>

      {session.status === "signed-out" && (
        <p className="comment-join">
          <Link href="/admin/?join=1" className="btn btn-primary">
            Join to comment
          </Link>{" "}
          <Link href="/admin/" className="btn">
            Log in
          </Link>
        </p>
      )}

      {me && (
        <form
          className="comment-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!body.trim()) return;
            setBusy(true);
            setNote({});
            try {
              await addComment(articleId, me.id, body);
              setBody("");
              setNote({ message: staff ? "Posted. Approve it below to make it public." : "Thanks! Your comment will appear once an editor approves it." });
              reload();
            } catch (err) {
              setNote({ error: (err as Error).message });
            } finally {
              setBusy(false);
            }
          }}
        >
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000} placeholder="Say something…" />
          <button className="btn btn-primary" disabled={busy || !body.trim()}>
            Post comment
          </button>
          {note.error && <p className="form-error">{note.error}</p>}
          {note.message && <p className="form-message">{note.message}</p>}
        </form>
      )}
    </section>
  );
}
