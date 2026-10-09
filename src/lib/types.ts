export type Category = {
  id: number;
  name: string;
  slug: string;
  position: number;
};

export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  category_id: number | null;
  author_id: string | null;
  status: "draft" | "published";
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleWithMeta = Article & {
  category: Pick<Category, "name" | "slug"> | null;
  author: { display_name: string | null } | null;
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "admin" | "editor" | "pending";
  created_at: string;
};
