"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { AccountNav } from "@/components/AccountNav";

// The main menu. Story types live inside Videos / Stories / Profiles.
export const MENU = [
  { href: "/stories/?view=videos", label: "Videos" },
  { href: "/stories/?view=stories", label: "Stories" },
  { href: "/stories/?view=profiles", label: "Profiles" },
  { href: "/manifesto/", label: "Manifesto" },
  { href: "/marketplace/", label: "Marketplace" },
];

export function SectionNav({ sticky = false }: { sticky?: boolean }) {
  return (
    <nav className={`section-nav ${sticky ? "section-nav-sticky" : ""}`} aria-label="Menu">
      <div className="container">
        {sticky && (
          <Link href="/" className="nav-brand">
            <Wordmark />
          </Link>
        )}
        {MENU.map((m) => (
          <Link key={m.href} href={m.href}>
            {m.label}
          </Link>
        ))}
        {sticky && <Link href="/search/">Search</Link>}
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
      <input name="q" type="search" placeholder="Search or #tag" aria-label="Search articles" />
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
