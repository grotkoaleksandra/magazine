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
  opts: {
    categoryId?: number;
    search?: string;
    tags?: string[];
    limit?: number;
    kind?: Kind;
    featured?: boolean;
    authorId?: string;
  } = {},
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
  if (opts.tags?.length) query = query.contains("tags", opts.tags);
  if (opts.search) {
    const term = opts.search.replace(/[%,(){}"]/g, " ").trim();
    const asTag = term.toLowerCase().replace(/\s+/g, "");
    query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,tags.cs.{${asTag}}`);
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

// Every tag used on a published article, most used first.
export async function fetchTagCounts() {
  const { data, error } = await supabase.from("articles").select("tags").eq("status", "published");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) for (const t of row.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag, count]) => ({ tag, count }));
}

// "More like this": published articles that share the most tags, then the same section.
export async function fetchRelated(article: ArticleWithMeta, limit = 6) {
  const candidates = new Map<number, ArticleWithMeta>();
  if (article.tags?.length) {
    const { data } = await supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .overlaps("tags", article.tags)
      .neq("id", article.id)
      .limit(40);
    for (const a of (data ?? []) as ArticleWithMeta[]) candidates.set(a.id, a);
  }
  if (candidates.size < limit) {
    let q = supabase.from("articles").select(ARTICLE_SELECT).eq("status", "published").neq("id", article.id);
    q = article.category_id ? q.eq("category_id", article.category_id) : q.eq("kind", article.kind);
    const { data } = await q.order("published_at", { ascending: false }).limit(limit);
    for (const a of (data ?? []) as ArticleWithMeta[]) if (!candidates.has(a.id)) candidates.set(a.id, a);
  }

  const shared = (a: ArticleWithMeta) => a.tags.filter((t) => article.tags.includes(t));
  const ranked = [...candidates.values()]
    .map((a) => ({ a, score: shared(a).length * 10 + (a.category_id === article.category_id ? 3 : 0) }))
    .sort((x, y) => y.score - x.score || (y.a.published_at ?? "").localeCompare(x.a.published_at ?? ""))
    .slice(0, limit)
    .map((x) => x.a);

  // Name the tag most of the suggestions have in common, for the heading.
  const counts = new Map<string, number>();
  for (const a of ranked) for (const t of shared(a)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const topTag = [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
  return { articles: ranked, topTag };
}
