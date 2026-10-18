import { supabase } from "@/lib/supabase";
import type { ArticleWithMeta, Category } from "@/lib/types";

export const ARTICLE_SELECT = "*, category:categories(name, slug), author:authors(display_name)";

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("position").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPublished(opts: { categoryId?: number; search?: string; limit?: number } = {}) {
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
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ArticleWithMeta[];
}

// Drafts are only returned to signed-in staff (enforced by row level security).
export async function fetchArticleBySlug(slug: string) {
  const { data, error } = await supabase.from("articles").select(ARTICLE_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as ArticleWithMeta | null;
}
