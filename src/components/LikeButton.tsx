"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setLike } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

// Heart with a public count. Signed-out visitors are invited to join.
export function LikeButton({ articleId, count: initial, size = "md" }: { articleId: number; count: number; size?: "md" | "lg" }) {
  const session = useSession();
  const userId = session.status === "signed-in" ? session.profile?.id : undefined;
  const [count, setCount] = useState(initial);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("likes")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => !cancelled && setLiked(Boolean(data)));
    return () => {
      cancelled = true;
    };
  }, [articleId, userId]);

  if (session.status === "signed-out") {
    return (
      <Link href="/admin/?join=1" className={`like like-${size}`} title="Join to like">
        <Heart filled={false} />
        <span>{count}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`like like-${size} ${liked ? "is-liked" : ""}`}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      disabled={!userId}
      onClick={async (e) => {
        e.preventDefault();
        if (!userId) return;
        const next = !liked;
        setLiked(next);
        setCount((c) => c + (next ? 1 : -1));
        try {
          await setLike(articleId, userId, next);
        } catch {
          setLiked(!next);
          setCount((c) => c + (next ? -1 : 1));
        }
      }}
    >
      <Heart filled={liked} />
      <span>{count}</span>
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.9 4.5 6.6 4.5c2.2 0 3.6 1.3 5.4 3.3 1.8-2 3.2-3.3 5.4-3.3 3.7 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z" strokeLinejoin="round" />
    </svg>
  );
}
