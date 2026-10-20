import { supabase } from "@/lib/supabase";
import { basePath } from "@/lib/site";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { normalizeTags, slugify } from "@/lib/format";
import { isStaffRole, type Kind, type Role, type Status } from "@/lib/types";

// Admin operations run in the browser. Supabase Row Level Security
// (supabase/schema.sql) is what actually restricts them to staff.

export type FormState = { error?: string; message?: string; savedId?: number; status?: string } | undefined;

// ── Auth ────────────────────────────────────────────────────

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  return error ? { error: error.message } : undefined;
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: {
      data: { display_name: String(formData.get("name") || "") },
      emailRedirectTo: `${window.location.origin}${basePath}/admin/`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your inbox to confirm your email, then sign in." };
  return undefined;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ── Articles ────────────────────────────────────────────────

async function currentRole(userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return (data?.role ?? "member") as Role;
}

export async function saveArticle(_prev: FormState, formData: FormData): Promise<FormState> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You've been signed out. Sign in again and retry." };
  const staff = isStaffRole(await currentRole(user.id));

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Please give the post a title." };

  // Only editors and admins write stories now; members comment, like and use the marketplace.
  if (!staff) return { error: "Only editors can publish stories." };
  const intent = String(formData.get("intent"));
  const current = String(formData.get("status") || "draft") as Status;
  const status: Status = intent === "publish" ? "published" : intent === "unpublish" ? "draft" : current;
  const kind: Kind = "magazine";
  const categoryId = formData.get("category_id") ? Number(formData.get("category_id")) : null;

  // Make sure the slug is unique by appending -2, -3… if needed.
  const base = slugify(String(formData.get("slug") || "") || title) || "post";
  let slug = base;
  for (let n = 2; ; n++) {
    let q = supabase.from("articles").select("id").eq("slug", slug);
    if (id) q = q.neq("id", id);
    const { data } = await q.maybeSingle();
    if (!data) break;
    slug = `${base}-${n}`;
  }

  const fields = {
    title,
    slug,
    excerpt: String(formData.get("excerpt") || "").trim(),
    body: sanitizeArticleHtml(String(formData.get("body") || "")),
    cover_image_url: String(formData.get("cover_image_url") || "") || null,
    video_url: String(formData.get("video_url") || "") || null,
    category_id: categoryId,
    kind,
    tags: normalizeTags(formData.getAll("tags").join(" ")),
    featured: staff && formData.get("featured") === "on",
    status,
    updated_at: new Date().toISOString(),
  };

  // Someone else's unpublished post can hold a slug we can't see; retry with a random suffix.
  const write = async (values: typeof fields) => {
    if (id) {
      const { data: existing } = await supabase.from("articles").select("published_at").eq("id", id).single();
      const published_at = existing?.published_at ?? (status === "published" ? new Date().toISOString() : null);
      const { error } = await supabase.from("articles").update({ ...values, published_at }).eq("id", id);
      return { id, error };
    }
    const { data, error } = await supabase
      .from("articles")
      .insert({ ...values, author_id: user.id, published_at: status === "published" ? new Date().toISOString() : null })
      .select("id")
      .single();
    return { id: data?.id as number | undefined, error };
  };

  let result = await write(fields);
  if (result.error?.code === "23505") {
    result = await write({ ...fields, slug: `${base}-${Math.random().toString(36).slice(2, 6)}` });
  }
  if (result.error) return { error: result.error.message };

  return { savedId: result.id!, status };
}

export async function deleteArticle(id: number) {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}

// ── Categories ──────────────────────────────────────────────

export async function createCategory(name: string): Promise<FormState> {
  name = name.trim();
  if (!name) return { error: "Enter a name." };
  const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("categories").insert({ name, slug: slugify(name), position: (count ?? 0) + 1 });
  if (error) return { error: error.code === "23505" ? "That story type already exists." : error.message };
  return { message: `Added “${name}”.` };
}

export async function deleteCategory(id: number) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ── Team ────────────────────────────────────────────────────

export async function setRole(id: string, role: Role) {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw error;
}

// ── Profile ─────────────────────────────────────────────────

export async function updateProfile(id: string, values: { display_name: string; bio: string; avatar_url: string | null }) {
  const { error } = await supabase.from("profiles").update(values).eq("id", id);
  if (error) throw error;
}

// ── Images ──────────────────────────────────────────────────

// Uploads an image to the public "media" bucket and returns its URL.
export async function uploadImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Images must be under 10 MB.");
  return uploadMedia(file);
}

// Supabase's free plan caps uploads at 50 MB per file.
export async function uploadVideo(file: File) {
  if (!file.type.startsWith("video/")) throw new Error("Please choose a video file (MP4 or WebM).");
  if (file.size > 50 * 1024 * 1024) throw new Error("Videos must be under 50 MB. Try exporting a shorter or smaller clip.");
  return uploadMedia(file);
}

async function uploadMedia(file: File) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  // Each person uploads into their own folder (see storage policies in schema.sql).
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// ── Likes ───────────────────────────────────────────────────
export async function setLike(articleId: number, userId: string, liked: boolean) {
  const { error } = liked
    ? await supabase.from("likes").insert({ article_id: articleId, user_id: userId })
    : await supabase.from("likes").delete().eq("article_id", articleId).eq("user_id", userId);
  if (error && error.code !== "23505") throw error;
}

// ── Comments ────────────────────────────────────────────────
export async function addComment(articleId: number, userId: string, body: string) {
  const { error } = await supabase.from("comments").insert({ article_id: articleId, author_id: userId, body: body.trim() });
  if (error) throw error;
}
export async function moderateComment(id: number, action: "approve" | "delete", body?: string) {
  const { error } =
    action === "delete"
      ? await supabase.from("comments").delete().eq("id", id)
      : await supabase.from("comments").update({ status: "approved", ...(body !== undefined ? { body } : {}) }).eq("id", id);
  if (error) throw error;
}
export async function updateComment(id: number, body: string) {
  const { error } = await supabase.from("comments").update({ body }).eq("id", id);
  if (error) throw error;
}

// ── Marketplace ─────────────────────────────────────────────
export async function addListing(userId: string, values: Record<string, string | null>) {
  const { error } = await supabase.from("listings").insert({ ...values, author_id: userId });
  if (error) throw error;
}
export async function moderateListing(id: number, action: "approve" | "delete") {
  const { error } =
    action === "delete"
      ? await supabase.from("listings").delete().eq("id", id)
      : await supabase.from("listings").update({ status: "approved" }).eq("id", id);
  if (error) throw error;
}
