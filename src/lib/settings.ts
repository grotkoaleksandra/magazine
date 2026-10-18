import { supabase } from "@/lib/supabase";

export type SiteSettings = { hero_video_url?: string };

export async function fetchSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export async function saveSetting(key: keyof SiteSettings, value: string) {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
