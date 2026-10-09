import { createClient } from "@/lib/supabase/server";
import type { ArticleWithMeta, Category } from "@/lib/types";

const ARTICLE_SELECT = "*, category:categories(name, slug), author:authors(display_name)";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("position").order("name");
  return data ?? [];
}

export async function getPublishedArticles(opts: { categoryId?: number; search?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 30);
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.search) {
    const term = opts.search.replace(/[%,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
  }
  const { data } = await query;
  return (data ?? []) as ArticleWithMeta[];
}

// Drafts are only returned to signed-in staff (enforced by row level security).
export async function getArticleBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select(ARTICLE_SELECT).eq("slug", slug).maybeSingle();
  return data as ArticleWithMeta | null;
}
