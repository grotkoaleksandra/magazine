"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { deleteArticle, saveArticle } from "@/app/admin/actions";
import { slugify } from "@/lib/format";
import type { Article, Category } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { RichTextEditor } from "./RichTextEditor";
import { uploadImage } from "./upload";

export function ArticleEditor({
  article,
  categories,
  saved,
}: {
  article?: Article;
  categories: Category[];
  saved?: string;
}) {
  const [state, action, pending] = useActionState(saveArticle, undefined);
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(article));
  const [body, setBody] = useState(article?.body ?? "");
  const [cover, setCover] = useState(article?.cover_image_url ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");

  const isPublished = article?.status === "published";

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
        <input type="hidden" name="status" value={article?.status ?? "draft"} />
        <input type="hidden" name="body" value={body} />
        <input type="hidden" name="cover_image_url" value={cover} />

        <div className="admin-header">
          <div>
            <Link href="/admin" className="muted back-link">
              ← All articles
            </Link>
            <h1>{article ? "Edit article" : "New article"}</h1>
          </div>
          <div className="actions">
            {article && (
              <Link href={`/article/${article.slug}`} target="_blank" className="btn">
                {isPublished ? "View ↗" : "Preview ↗"}
              </Link>
            )}
            <button name="intent" value="save" className="btn" disabled={pending || coverUploading}>
              {isPublished ? "Update" : "Save draft"}
            </button>
            {isPublished ? (
              <button name="intent" value="unpublish" className="btn" disabled={pending}>
                Unpublish
              </button>
            ) : (
              <button name="intent" value="publish" className="btn btn-primary" disabled={pending || coverUploading}>
                Publish
              </button>
            )}
          </div>
        </div>

        {state?.error && <p className="form-error">{state.error}</p>}
        {saved && !state?.error && (
          <p className="form-message">{saved === "published" ? "Saved and published." : "Draft saved."}</p>
        )}

        <div className="editor-layout">
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
            <RichTextEditor initialHtml={article?.body ?? ""} onChange={setBody} />
          </div>

          <aside className="editor-side">
            <div className="panel">
              <label className="field">
                Status
                <span className={`tag tag-${article?.status ?? "draft"}`}>{isPublished ? "Published" : "Draft"}</span>
              </label>
              <label className="field">
                Section
                <select name="category_id" defaultValue={article?.category_id ?? ""}>
                  <option value="">— None —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                URL
                <span className="slug-input">
                  /article/
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
              <label className="checkbox">
                <input type="checkbox" name="featured" defaultChecked={article?.featured ?? false} />
                Lead story on the front page
              </label>
            </div>

            <div className="panel">
              <span className="field-label">Cover image</span>
              {cover ? (
                <div className="cover-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt="" />
                  <button type="button" className="link-button danger" onClick={() => setCover("")}>
                    Remove
                  </button>
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
        </div>
      </form>

      {article && (
        <form action={deleteArticle} className="danger-zone">
          <input type="hidden" name="id" value={article.id} />
          <ConfirmButton message="Delete this article permanently?" className="link-button danger">
            Delete article
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
