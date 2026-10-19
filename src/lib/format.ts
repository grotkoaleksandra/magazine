import { isTag } from "@/lib/tags";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function readingTime(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

// "#Events, #people  food" → ["events", "people"] (only the site's five tags are kept)
export function normalizeTags(input: string) {
  const tags = input
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+/, "").replace(/[^\p{L}\p{N}_-]/gu, ""))
    .filter(Boolean);
  return [...new Set(tags)].filter(isTag);
}

// "3 hours ago", "2 days ago", then a plain date after a month.
export function timeAgo(iso: string | null) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const units: [number, string][] = [[60, "minute"], [3600, "hour"], [86400, "day"], [604800, "week"]];
  if (s < 60) return "just now";
  if (s > 30 * 86400) return formatDate(iso);
  let unit = units[0];
  for (const u of units) if (s >= u[0]) unit = u;
  const n = Math.floor(s / unit[0]);
  return `${n} ${unit[1]}${n === 1 ? "" : "s"} ago`;
}
