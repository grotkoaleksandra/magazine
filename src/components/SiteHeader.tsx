"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { fetchCategories } from "@/lib/data";
import { useQuery } from "@/lib/useQuery";

export function SectionNav() {
  const { data: categories } = useQuery(fetchCategories, []);
  return (
    <nav className="section-nav" aria-label="Sections">
      <div className="container">
        <Link href="/">Latest</Link>
        {categories?.map((c) => (
          <Link key={c.id} href={`/category/?s=${c.slug}`}>
            {c.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function HeaderSearch() {
  const router = useRouter();
  return (
    <form
      className="masthead-search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q");
        router.push(`/search/?q=${encodeURIComponent(String(q ?? ""))}`);
      }}
    >
      <input name="q" type="search" placeholder="Search" aria-label="Search articles" />
    </form>
  );
}

// Read on the client so the static page doesn't freeze the build date.
const noop = () => () => {};
export function Today() {
  const today = useSyncExternalStore(
    noop,
    () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    () => "",
  );
  return <span className="masthead-date">{today}</span>;
}
