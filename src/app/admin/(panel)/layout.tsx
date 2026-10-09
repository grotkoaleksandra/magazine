import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { signOut } from "../actions";
import "../admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", user.id).single();

  if (!profile || profile.role === "pending") {
    return (
      <main className="auth">
        <div className="auth-card">
          <h1 className="auth-brand">Almost there</h1>
          <p>Your account is waiting for an admin to approve it. Ask them to give you access in the Team page.</p>
          <form action={signOut}>
            <button className="btn">Sign out</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="admin">
      <aside className="admin-nav">
        <Link href="/admin" className="admin-brand">
          {site.name}
        </Link>
        <nav>
          <Link href="/admin/articles/new" className="btn btn-primary">
            + New article
          </Link>
          <Link href="/admin">Articles</Link>
          <Link href="/admin/categories">Sections</Link>
          {profile.role === "admin" && <Link href="/admin/team">Team</Link>}
          <Link href="/" target="_blank">
            View site ↗
          </Link>
        </nav>
        <div className="admin-user">
          <span>{profile.display_name ?? user.email}</span>
          <form action={signOut}>
            <button className="link-button">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
