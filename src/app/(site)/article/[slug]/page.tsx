import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/articles";
import { formatDate, readingTime } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/article/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      images: article.cover_image_url ? [article.cover_image_url] : [],
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="story">
      {article.status === "draft" && (
        <div className="draft-banner">
          Draft preview — only staff can see this. <Link href={`/admin/articles/${article.id}`}>Edit</Link>
        </div>
      )}
      <header className="story-header">
        {article.category && (
          <Link href={`/category/${article.category.slug}`} className="kicker">
            {article.category.name}
          </Link>
        )}
        <h1 className="story-title">{article.title}</h1>
        {article.excerpt && <p className="story-dek">{article.excerpt}</p>}
        <p className="byline">
          {article.author?.display_name && <>By {article.author.display_name} · </>}
          {formatDate(article.published_at ?? article.updated_at)} · {readingTime(article.body)} min read
        </p>
      </header>
      {article.cover_image_url && (
        <figure className="story-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover_image_url} alt="" />
        </figure>
      )}
      {/* Body HTML is sanitized on save (see lib/sanitize.ts). */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: article.body }} />
    </article>
  );
}
