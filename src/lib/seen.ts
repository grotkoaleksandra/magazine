"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Which stories this visitor has already seen, so the front page can show unseen ones first.
// Everyone: remembered in this browser. Logged-in members: also saved to their account (any device).

const SEEN_KEY = "byb-seen";
const VISIT_KEY = "byb-last-visit";
const SESSION_PREV_KEY = "byb-prev-visit";

function readLocal(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]") as number[]);
  } catch {
    return new Set();
  }
}

function writeLocal(ids: Set<number>) {
  try {
    // Keep the list from growing forever: the most recent 2,000 is plenty.
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-2000)));
  } catch {}
}

// The visitor's previous visit (fixed for the whole browsing session), used for "NEW" labels.
function previousVisit(): string | null {
  try {
    const kept = sessionStorage.getItem(SESSION_PREV_KEY);
    if (kept !== null) return kept || null;
    const prev = localStorage.getItem(VISIT_KEY) ?? "";
    sessionStorage.setItem(SESSION_PREV_KEY, prev);
    localStorage.setItem(VISIT_KEY, new Date().toISOString());
    return prev || null;
  } catch {
    return null;
  }
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function markSeen(articleId: number) {
  const ids = readLocal();
  if (ids.has(articleId)) return;
  ids.add(articleId);
  writeLocal(ids);
  const userId = await currentUserId();
  if (userId) await supabase.from("seen").upsert({ user_id: userId, article_id: articleId }, { ignoreDuplicates: true });
}

export type SeenState = { seen: Set<number>; previousVisit: string | null };

// Loads the seen list once (browser + account merged). Returns null until ready.
export function useSeen(): SeenState | null {
  const [state, setState] = useState<SeenState | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prev = previousVisit();
      const local = readLocal();
      const userId = await currentUserId();
      if (userId) {
        const { data } = await supabase.from("seen").select("article_id").eq("user_id", userId);
        const remote = new Set((data ?? []).map((r) => r.article_id as number));
        // Bring the account up to date with anything seen here while logged out, and vice versa.
        const missing = [...local].filter((id) => !remote.has(id));
        if (missing.length) {
          await supabase.from("seen").upsert(
            missing.map((article_id) => ({ user_id: userId, article_id })),
            { ignoreDuplicates: true },
          );
        }
        remote.forEach((id) => local.add(id));
        writeLocal(local);
      }
      if (!cancelled) setState({ seen: local, previousVisit: prev });
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
