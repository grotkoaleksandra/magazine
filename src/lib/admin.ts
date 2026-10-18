import { supabase } from "@/lib/supabase";
import { basePath } from "@/lib/site";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/format";

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

export async function saveArticle(_prev: FormState, formData: FormData): Promise<FormState> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You've been signed out. Sign in again and retry." };

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Please give the article a title." };

  const intent = String(formData.get("intent"));
  const status =
    intent === "publish" ? "published" : intent === "unpublish" ? "draft" : String(formData.get("status") || "draft");

  // Make sure the slug is unique by appending -2, -3… if needed.
  const base = slugify(String(formData.get("slug") || "") || title) || "article";
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
    category_id: formData.get("category_id") ? Number(formData.get("category_id")) : null,
    featured: formData.get("featured") === "on",
    status,
    updated_at: new Date().toISOString(),
  };

  let savedId = id;
  if (id) {
    const { data: existing } = await supabase.from("articles").select("published_at").eq("id", id).single();
    const published_at = existing?.published_at ?? (status === "published" ? new Date().toISOString() : null);
    const { error } = await supabase.from("articles").update({ ...fields, published_at }).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("articles")
      .insert({ ...fields, author_id: user.id, published_at: status === "published" ? new Date().toISOString() : null })
      .select("id")
      .single();
    if (error) return { error: error.message };
    savedId = data.id;
  }

  // Only one lead story at a time.
  if (fields.featured) {
    await supabase.from("articles").update({ featured: false }).neq("id", savedId!).eq("featured", true);
  }

  return { savedId: savedId!, status };
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
  if (error) return { error: error.code === "23505" ? "That section already exists." : error.message };
  return { message: `Added “${name}”.` };
}

export async function deleteCategory(id: number) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ── Team ────────────────────────────────────────────────────

export async function setRole(id: string, role: "admin" | "editor" | "pending") {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw error;
}

// ── Images ──────────────────────────────────────────────────

// Uploads an image to the public "media" bucket and returns its URL.
export async function uploadImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Images must be under 10 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
