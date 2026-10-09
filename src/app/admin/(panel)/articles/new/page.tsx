import { getCategories } from "@/lib/articles";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

export default async function NewArticlePage() {
  const categories = await getCategories();
  return <ArticleEditor categories={categories} />;
}
