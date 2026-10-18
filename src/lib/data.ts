import { supabase } from "@/lib/supabase";
import type { ArticleWithMeta, Author, Category, Kind } from "@/lib/types";

export const ARTICLE_SELECT = "*, category:categories(name, slug), author:authors(id, display_name, avatar_url)";

export const BOARD_NAME = "Members' Board";

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("position").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPublished(
  opts: { categoryId?: number; search?: string; limit?: number; kind?: Kind; featured?: boolean; authorId?: string } = {},
) {
  let query = supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 30);
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.kind) query = query.eq("kind", opts.kind);
  if (opts.featured !== undefined) query = query.eq("featured", opts.featured);
  if (opts.authorId) query = query.eq("author_id", opts.authorId);
  if (opts.search) {
    const term = opts.search.replace(/[%,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ArticleWithMeta[];
}

// Drafts and posts under review are only returned to their author and to staff
// (enforced by row level security).
export async function fetchArticleBySlug(slug: string) {
  const { data, error } = await supabase.from("articles").select(ARTICLE_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as ArticleWithMeta | null;
}

export async function fetchAuthor(id: string) {
  const { data, error } = await supabase.from("authors").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Author | null;
}

// Members who have had at least one Board post published.
export async function fetchContributors() {
  const { data, error } = await supabase.from("articles").select("author_id").eq("status", "published").eq("kind", "member");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) if (row.author_id) counts.set(row.author_id, (counts.get(row.author_id) ?? 0) + 1);
  if (!counts.size) return [];
  const { data: authors, error: e2 } = await supabase.from("authors").select("*").in("id", [...counts.keys()]);
  if (e2) throw e2;
  return ((authors ?? []) as Author[])
    .map((a) => ({ ...a, posts: counts.get(a.id) ?? 0 }))
    .sort((a, b) => b.posts - a.posts);
}
