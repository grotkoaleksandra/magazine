import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = Boolean(url && key);

// The publishable key is safe to ship to the browser: Row Level Security in
// supabase/schema.sql decides what each visitor can read and write.
export const supabase = createClient(url || "https://not-configured.supabase.co", key || "not-configured");
