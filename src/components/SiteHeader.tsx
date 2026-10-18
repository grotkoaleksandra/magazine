"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { BOARD_NAME, fetchCategories } from "@/lib/data";
import { site } from "@/lib/site";
import { AccountNav } from "@/components/AccountNav";
import { useQuery } from "@/lib/useQuery";

export function SectionNav({ sticky = false }: { sticky?: boolean }) {
  const { data: categories } = useQuery(fetchCategories, []);
  return (
    <nav className={`section-nav ${sticky ? "section-nav-sticky" : ""}`} aria-label="Sections">
      <div className="container">
        {sticky && (
          <Link href="/" className="nav-brand">
            {site.name}
          </Link>
        )}
        <Link href="/">Latest</Link>
        {categories?.map((c) => (
          <Link key={c.id} href={`/category/?s=${c.slug}`}>
            {c.name}
          </Link>
        ))}
        <Link href="/members/" className="nav-board">
          {BOARD_NAME}
        </Link>
        {sticky && <AccountNav />}
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
