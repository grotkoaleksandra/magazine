import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Staff login" };

export default function LoginPage() {
  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          {site.name}
        </Link>
        <p className="muted">Staff sign in</p>
        <LoginForm />
      </div>
    </main>
  );
}
