import Link from "next/link";
import { getCategories } from "@/lib/articles";
import { site } from "@/lib/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <header className="masthead">
        <div className="masthead-top container">
          <span className="masthead-date">{today}</span>
          <form action="/search" className="masthead-search">
            <input name="q" type="search" placeholder="Search" aria-label="Search articles" />
          </form>
        </div>
        <div className="container">
          <Link href="/" className="masthead-title">
            {site.name}
          </Link>
          <p className="masthead-tagline">{site.tagline}</p>
        </div>
        <nav className="section-nav" aria-label="Sections">
          <div className="container">
            <Link href="/">Latest</Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="container site-main">{children}</main>
      <footer className="site-footer">
        <div className="container">
          <span className="footer-name">{site.name}</span>
          <span>© {new Date().getFullYear()} · {site.description}</span>
          <Link href="/admin">Staff login</Link>
        </div>
      </footer>
    </>
  );
}
