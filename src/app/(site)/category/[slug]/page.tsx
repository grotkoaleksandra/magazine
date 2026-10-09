import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { getCategories, getPublishedArticles } from "@/lib/articles";

async function findCategory(slug: string) {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const category = await findCategory((await params).slug);
  return category ? { title: category.name } : {};
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const category = await findCategory((await params).slug);
  if (!category) notFound();
  const articles = await getPublishedArticles({ categoryId: category.id });

  return (
    <>
      <h1 className="page-heading">{category.name}</h1>
      {articles.length === 0 ? (
        <p className="muted">Nothing published in {category.name} yet.</p>
      ) : (
        <div className="grid">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </>
  );
}
