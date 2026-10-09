import { notFound } from "next/navigation";
import { getCategories } from "@/lib/articles";
import { createClient } from "@/lib/supabase/server";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import type { Article } from "@/lib/types";

export default async function EditArticlePage({ params, searchParams }: PageProps<"/admin/articles/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("*").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const categories = await getCategories();

  return (
    <ArticleEditor
      key={`${data.id}-${data.updated_at}`}
      article={data as Article}
      categories={categories}
      saved={typeof saved === "string" ? saved : undefined}
    />
  );
}
