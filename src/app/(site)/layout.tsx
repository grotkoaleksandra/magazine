import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { SectionNav, HeaderSearch, Today } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountNav } from "@/components/AccountNav";
import { site } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="masthead">
        <div className="masthead-top container">
          <Today />
          <span className="masthead-right">
            <HeaderSearch />
            <AccountNav />
          </span>
        </div>
        <div className="container">
          <Link href="/" className="masthead-title">
            <Wordmark />
          </Link>
          <p className="masthead-tagline">{site.tagline}</p>
        </div>
        <SectionNav />
      </header>
      <main className="container site-main">{children}</main>
      <SiteFooter />
    </>
  );
}
