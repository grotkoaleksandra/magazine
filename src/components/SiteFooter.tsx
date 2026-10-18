import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <span className="footer-name">{site.name}</span>
        <span>{site.description}</span>
        <Link href="/admin/?join=1">Become a member to contribute</Link>
      </div>
    </footer>
  );
}
