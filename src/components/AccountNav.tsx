"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/lib/useSession";

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
    </svg>
  );
}

// "Dashboard" + profile icon when signed in; an invitation to join when not.
export function AccountNav() {
  const session = useSession();

  if (session.status === "loading") return <span className="account-nav" />;

  if (session.status === "signed-out") {
    return (
      <span className="account-nav">
        <Link href="/admin/">Log in</Link>
        <Link href="/admin/?join=1" className="account-join">
          Join
        </Link>
      </span>
    );
  }

  const p = session.profile;
  return (
    <span className="account-nav">
      <Link href="/admin/">Dashboard</Link>
      <Link href="/admin/profile/" className="account-icon" aria-label="My profile" title="My profile">
        {p?.avatar_url ? <Avatar name={p.display_name} url={p.avatar_url} size={28} /> : <PersonIcon />}
      </Link>
    </span>
  );
}
