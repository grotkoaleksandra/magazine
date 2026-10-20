"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { useStaff } from "@/components/admin/AdminShell";
import { ErrorNote, Loading } from "@/components/States";
import { fetchCategories } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export default function EditPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Edit />
    </Suspense>
  );
}

function Edit() {
  const { staff } = useStaff();
  const params = useSearchParams();
  const id = params.get("id");
  const saved = params.get("saved") ?? undefined;
  const savedAt = params.get("t");

  const { data, error, loading } = useQuery(async () => {
    const [categories, article] = await Promise.all([
      fetchCategories(),
      id
        ? supabase.from("articles").select("*").eq("id", Number(id)).maybeSingle().then(({ data, error }) => {
            if (error) throw error;
            return data as Article | null;
          })
        : Promise.resolve(undefined),
    ]);
    return { categories, article };
  }, [id, savedAt]);

  if (!staff) return <p className="muted">Stories are written by the editors. You can post in the marketplace instead.</p>;
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (id && !data?.article) return <p className="muted">That article doesn&apos;t exist.</p>;

  return (
    <ArticleEditor
      key={`${id ?? "new"}-${data!.article?.updated_at ?? ""}`}
      article={data!.article ?? undefined}
      categories={data!.categories}
      saved={saved}
    />
  );
}
