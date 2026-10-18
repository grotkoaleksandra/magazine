import Link from "next/link";
import { SectionNav, HeaderSearch, Today } from "@/components/SiteHeader";
import { site } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="masthead">
        <div className="masthead-top container">
          <Today />
          <HeaderSearch />
        </div>
        <div className="container">
          <Link href="/" className="masthead-title">
            {site.name}
          </Link>
          <p className="masthead-tagline">{site.tagline}</p>
        </div>
        <SectionNav />
      </header>
      <main className="container site-main">{children}</main>
      <footer className="site-footer">
        <div className="container">
          <span className="footer-name">{site.name}</span>
          <span>{site.description}</span>
          <Link href="/admin/">Staff login</Link>
        </div>
      </footer>
    </>
  );
}
