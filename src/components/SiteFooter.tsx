import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <span className="footer-name">
          <Wordmark />
        </span>
        <span>{site.description}</span>
        <Link href="/admin/?join=1">Become a member to contribute</Link>
      </div>
    </footer>
  );
}
