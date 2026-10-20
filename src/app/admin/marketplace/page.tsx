"use client";

import Link from "next/link";
import { useState } from "react";
import { useStaff } from "@/components/admin/AdminShell";
import { ErrorNote, Loading } from "@/components/States";
import { moderateListing } from "@/lib/admin";
import { timeAgo } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { listingKinds, type Listing } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

// Editors approve everyone's posts; members see and manage their own.
export default function MarketplaceAdminPage() {
  const { staff, user } = useStaff();
  const { data, error, loading, reload } = useQuery(async () => {
    let q = supabase.from("listings").select("*, author:authors!listings_author_id_fkey(id, display_name, avatar_url)").order("created_at", { ascending: false });
    if (!staff) q = q.eq("author_id", user.id);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Listing[];
  }, [staff, user.id]);
  const [tab, setTab] = useState<"pending" | "approved">("pending");

  const all = data ?? [];
  const list = all.filter((l) => l.status === tab);
  const pendingCount = all.filter((l) => l.status === "pending").length;

  return (
    <>
      <div className="admin-header">
        <h1>{staff ? "marketplace" : "my marketplace posts"}</h1>
        <Link href="/marketplace/new/" className="btn btn-primary">
          + Post something
        </Link>
      </div>
      <p className="muted">
        {staff ? "New posts appear on the Marketplace once you approve them." : "Your posts appear on the Marketplace once an editor approves them."}
      </p>
      <div className="tabs">
        <button className={`tab ${tab === "pending" ? "tab-on" : ""}`} onClick={() => setTab("pending")}>
          Waiting {pendingCount > 0 && <span className="count">{pendingCount}</span>}
        </button>
        <button className={`tab ${tab === "approved" ? "tab-on" : ""}`} onClick={() => setTab("approved")}>
          Live
        </button>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} />
      ) : list.length === 0 ? (
        <div className="panel empty-panel">
          <p>Nothing here.</p>
        </div>
      ) : (
        <div className="panel">
          <ul className="mod-list">
            {list.map((l) => (
              <li key={l.id}>
                <p className="mod-meta">
                  <span className="tag tag-draft">{listingKinds[l.kind]}</span> <strong>{l.title}</strong>
                  {l.price && <> · {l.price}</>} · by {l.author?.display_name ?? "member"} · {timeAgo(l.created_at)}
                </p>
                {l.body && <p className="mod-body">{l.body}</p>}
                <p className="muted">
                  {[l.location, l.contact].filter(Boolean).join(" · ")}
                </p>
                <div className="mod-actions">
                  {staff && l.status === "pending" && (
                    <button className="btn btn-primary" onClick={async () => (await moderateListing(l.id, "approve"), reload())}>
                      Approve
                    </button>
                  )}
                  <button
                    className="link-button danger"
                    onClick={async () => {
                      if (confirm("Delete this post?")) {
                        await moderateListing(l.id, "delete");
                        reload();
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
