"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/format";

export type FormState = { error?: string; message?: string } | undefined;

async function requireStaff(adminOnly = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const ok = adminOnly ? profile?.role === "admin" : profile?.role === "admin" || profile?.role === "editor";
  if (!ok) throw new Error("You don't have permission to do that.");
  return { supabase, user };
}

// ── Auth ────────────────────────────────────────────────────

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) return { error: error.message };
  redirect("/admin");
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: { data: { display_name: String(formData.get("name") || "") } },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your inbox to confirm your email, then sign in." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ── Articles ────────────────────────────────────────────────

export async function saveArticle(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireStaff();

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Please give the article a title." };

  const intent = String(formData.get("intent"));
  const status = intent === "publish" ? "published" : intent === "unpublish" ? "draft" : String(formData.get("status") || "draft");

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

  const categoryId = formData.get("category_id") ? Number(formData.get("category_id")) : null;
  const fields = {
    title,
    slug,
    excerpt: String(formData.get("excerpt") || "").trim(),
    body: sanitizeArticleHtml(String(formData.get("body") || "")),
    cover_image_url: String(formData.get("cover_image_url") || "") || null,
    category_id: categoryId,
    featured: formData.get("featured") === "on",
    status,
    updated_at: new Date().toISOString(),
  };

  let savedId = id;
  if (id) {
    const { data: existing } = await supabase.from("articles").select("published_at").eq("id", id).single();
    const published_at = status === "published" ? existing?.published_at ?? new Date().toISOString() : existing?.published_at ?? null;
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

  revalidatePath("/", "layout");
  redirect(`/admin/articles/${savedId}?saved=${status === "published" ? "published" : "draft"}`);
}

export async function deleteArticle(formData: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from("articles").delete().eq("id", Number(formData.get("id")));
  revalidatePath("/", "layout");
  redirect("/admin");
}

// ── Categories ──────────────────────────────────────────────

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireStaff();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Enter a name." };
  const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("categories").insert({ name, slug: slugify(name), position: (count ?? 0) + 1 });
  if (error) return { error: error.code === "23505" ? "That section already exists." : error.message };
  revalidatePath("/", "layout");
  return { message: `Added “${name}”.` };
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from("categories").delete().eq("id", Number(formData.get("id")));
  revalidatePath("/", "layout");
}

// ── Team ────────────────────────────────────────────────────

export async function setRole(formData: FormData) {
  const { supabase, user } = await requireStaff(true);
  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  if (id === user.id) throw new Error("You can't change your own role.");
  if (!["admin", "editor", "pending"].includes(role)) throw new Error("Unknown role.");
  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/team");
}
