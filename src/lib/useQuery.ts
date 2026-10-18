"use client";

import { useCallback, useEffect, useState } from "react";
import { isConfigured } from "@/lib/supabase";

type Result<T> = { key: string; data?: T; error: Error | null };

// Minimal data-loading hook: runs `fn` whenever `deps` change.
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([...deps, tick]);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Without Supabase keys every request would hang, so fail straight away.
    const run = isConfigured ? fn : () => Promise.reject(new Error("Supabase is not configured"));
    run()
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((e) => !cancelled && setResult({ key, error: e instanceof Error ? e : new Error(String(e?.message ?? e)) }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const loading = result?.key !== key;
  return { data: result?.data, error: loading ? null : (result?.error ?? null), loading, reload };
}
