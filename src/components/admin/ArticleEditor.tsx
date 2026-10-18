"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteArticle, saveArticle, uploadImage } from "@/lib/admin";
import { BOARD_NAME } from "@/lib/data";
import { slugify } from "@/lib/format";
import { statusLabel, type Article, type Category } from "@/lib/types";
import { useStaff } from "./AdminShell";
import { RichTextEditor } from "./RichTextEditor";

const savedMessages: Record<string, string> = {
  published: "Saved and published.",
  draft: "Draft saved.",
  pending: "Submitted — an editor will review it soon.",
};

export function ArticleEditor({
  article,
  categories,
  saved,
}: {
  article?: Article;
  categories: Category[];
  saved?: string;
}) {
  const router = useRouter();
  const { staff } = useStaff();
  const [state, action, pending] = useActionState(saveArticle, undefined);

  // After a save, reload the editor from the database with a confirmation note.
  useEffect(() => {
    if (state?.savedId) {
      router.replace(`/admin/edit/?id=${state.savedId}&saved=${state.status}&t=${Date.now()}`);
    }
  }, [state, router]);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(article));
  const [body, setBody] = useState(article?.body ?? "");
  const [cover, setCover] = useState(article?.cover_image_url ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");

  const status = article?.status ?? "draft";
  const isPublished = status === "published";
  // Members can't change a post once it's published; editors can.
  const locked = !staff && isPublished;
  const busy = pending || coverUploading;

  const placement =
    article?.kind === "member" ? "member" : article?.category_id ? `cat:${article.category_id}` : staff ? "magazine" : "member";

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverError("");
    setCoverUploading(true);
    try {
      setCover(await uploadImage(file));
    } catch (err) {
      setCoverError((err as Error).message);
    } finally {
      setCoverUploading(false);
    }
  }

  return (
    <>
      <form action={action} className="article-form">
        {article && <input type="hidden" name="id" value={article.id} />}
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="body" value={body} />
        <input type="hidden" name="cover_image_url" value={cover} />

        <div className="admin-header">
          <div>
            <Link href="/admin/" className="muted back-link">
              ← {staff ? "All articles" : "My posts"}
            </Link>
            <h1>{article ? (staff ? "Edit article" : "Edit post") : staff ? "New article" : "Write a post"}</h1>
          </div>
          <div className="actions">
            {article && (
              <Link href={`/article/?s=${article.slug}`} target="_blank" className="btn">
                {isPublished ? "View ↗" : "Preview ↗"}
              </Link>
            )}
            {staff ? (
              <>
                <button name="intent" value="save" className="btn" disabled={busy}>
                  {isPublished ? "Update" : "Save draft"}
                </button>
                {isPublished ? (
                  <button name="intent" value="unpublish" className="btn" disabled={busy}>
                    Unpublish
                  </button>
                ) : (
                  <>
                    {status === "pending" && (
                      <button name="intent" value="unpublish" className="btn" disabled={busy}>
                        Send back to writer
                      </button>
                    )}
                    <button name="intent" value="publish" className="btn btn-primary" disabled={busy}>
                      {status === "pending" ? "Approve & publish" : "Publish"}
                    </button>
                  </>
                )}
              </>
            ) : (
              !locked && (
                <>
                  <button name="intent" value="save" className="btn" disabled={busy}>
                    Save draft
                  </button>
                  {status === "pending" ? (
                    <button name="intent" value="withdraw" className="btn" disabled={busy}>
                      Withdraw
                    </button>
                  ) : (
                    <button name="intent" value="submit" className="btn btn-primary" disabled={busy}>
                      Submit for review
                    </button>
                  )}
                </>
              )
            )}
          </div>
        </div>

        {state?.error && <p className="form-error">{state.error}</p>}
        {saved && !state?.error && <p className="form-message">{savedMessages[saved] ?? "Saved."}</p>}
        {locked && (
          <p className="form-message">This post is published. Ask an editor if you&apos;d like something changed.</p>
        )}

        <fieldset className="editor-layout" disabled={locked}>
          <div className="editor-main">
            <input
              name="title"
              className="title-input"
              placeholder="Headline"
              value={title}
              required
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
            />
            <textarea
              name="excerpt"
              className="excerpt-input"
              placeholder="Standfirst — a one or two sentence summary shown under the headline"
              defaultValue={article?.excerpt ?? ""}
              rows={2}
            />
            <RichTextEditor initialHtml={article?.body ?? ""} onChange={setBody} editable={!locked} />
          </div>

          <aside className="editor-side">
            <div className="panel">
              <label className="field">
                Status
                <span className={`tag tag-${status}`}>{statusLabel[status]}</span>
              </label>
              {staff ? (
                <label className="field">
                  Where it appears
                  <select name="placement" defaultValue={placement}>
                    <option value="magazine">Magazine — no section</option>
                    {categories.map((c) => (
                      <option key={c.id} value={`cat:${c.id}`}>
                        Magazine — {c.name}
                      </option>
                    ))}
                    <option value="member">{BOARD_NAME}</option>
                  </select>
                </label>
              ) : (
                <label className="field">
                  Where it appears
                  <span className="field-value">{BOARD_NAME}</span>
                </label>
              )}
              <label className="field">
                URL
                <span className="slug-input">
                  /article/?s=
                  <input
                    name="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugEdited(true);
                    }}
                  />
                </span>
              </label>
              {staff && (
                <label className="checkbox">
                  <input type="checkbox" name="featured" defaultChecked={article?.featured ?? false} />
                  Featured on the front page
                </label>
              )}
            </div>

            <div className="panel">
              <span className="field-label">Cover image</span>
              {cover ? (
                <div className="cover-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt="" />
                  {!locked && (
                    <button type="button" className="link-button danger" onClick={() => setCover("")}>
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <label className="dropzone">
                  {coverUploading ? "Uploading…" : "Choose an image"}
                  <input type="file" accept="image/*" hidden onChange={onCover} />
                </label>
              )}
              {coverError && <p className="form-error">{coverError}</p>}
            </div>
          </aside>
        </fieldset>
      </form>

      {article && (staff || !isPublished) && (
        <div className="danger-zone">
          <button
            type="button"
            className="link-button danger"
            onClick={async () => {
              if (!confirm("Delete this post permanently?")) return;
              try {
                await deleteArticle(article.id);
                router.push("/admin/");
              } catch (err) {
                alert((err as Error).message);
              }
            }}
          >
            Delete {staff ? "article" : "post"}
          </button>
        </div>
      )}
    </>
  );
}
