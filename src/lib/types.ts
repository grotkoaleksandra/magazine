export type Role = "admin" | "editor" | "member";
export type Status = "draft" | "pending" | "published";
export type Kind = "magazine" | "member";

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
  video_url: string | null;
  category_id: number | null;
  author_id: string | null;
  kind: Kind;
  status: Status;
  featured: boolean;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Author = {
  id: string;
  display_name: string | null;
  bio: string;
  avatar_url: string | null;
  role: Role;
};

export type ArticleWithMeta = Article & {
  category: Pick<Category, "name" | "slug"> | null;
  author: Pick<Author, "id" | "display_name" | "avatar_url"> | null;
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  bio: string;
  avatar_url: string | null;
  role: Role;
  created_at: string;
};

export const isStaffRole = (role: Role | undefined) => role === "admin" || role === "editor";

export const statusLabel: Record<Status, string> = {
  draft: "Draft",
  pending: "Awaiting review",
  published: "Published",
};

export type Comment = {
  id: number;
  article_id: number;
  author_id: string;
  body: string;
  status: "pending" | "approved";
  created_at: string;
  author?: Pick<Author, "id" | "display_name" | "avatar_url"> | null;
  article?: { title: string; slug: string } | null;
};

export type ListingKind = "for-sale" | "for-rent" | "services" | "events" | "other";

export type Listing = {
  id: number;
  author_id: string;
  kind: ListingKind;
  title: string;
  body: string;
  price: string;
  location: string;
  contact: string;
  image_url: string | null;
  status: "pending" | "approved";
  created_at: string;
  author?: Pick<Author, "id" | "display_name" | "avatar_url"> | null;
};

export const listingKinds: Record<ListingKind, string> = {
  "for-sale": "For sale",
  "for-rent": "For rent",
  services: "Services",
  events: "Events",
  other: "Other",
};
