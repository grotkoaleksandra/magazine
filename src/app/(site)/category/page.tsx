"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Masonry } from "@/components/Masonry";
import { ErrorNote, Loading } from "@/components/States";
import { fetchCategories, fetchPublished } from "@/lib/data";
import { site } from "@/lib/site";
import { useQuery } from "@/lib/useQuery";

export default function CategoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Category />
    </Suspense>
  );
}

function Category() {
  const slug = useSearchParams().get("s") ?? "";
  const { data, error, loading } = useQuery(async () => {
    const category = (await fetchCategories()).find((c) => c.slug === slug);
    const articles = category ? await fetchPublished({ categoryId: category.id }) : [];
    return { category, articles };
  }, [slug]);

  useEffect(() => {
    if (data?.category) document.title = `${data.category.name} — ${site.name}`;
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!data?.category) return <h1 className="page-heading">Section not found</h1>;

  return (
    <>
      <h1 className="page-heading">{data.category.name}</h1>
      {data.articles.length === 0 ? (
        <p className="muted">Nothing published in {data.category.name} yet.</p>
      ) : (
        <Masonry articles={data.articles} columns={[2, 1, 1]} />
      )}
    </>
  );
}
