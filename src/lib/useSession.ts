"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

type SessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; profile: Pick<Profile, "id" | "display_name" | "avatar_url" | "role"> | null };

// Who is viewing the public site (for the account links in the header).
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load(userId: string | null) {
      if (!userId) return !cancelled && setState({ status: "signed-out" });
      const { data } = await supabase.from("profiles").select("id, display_name, avatar_url, role").eq("id", userId).maybeSingle();
      if (!cancelled) setState({ status: "signed-in", profile: data });
    }
    supabase.auth.getSession().then(({ data }) => load(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event !== "TOKEN_REFRESHED") setTimeout(() => load(s?.user.id ?? null), 0);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
