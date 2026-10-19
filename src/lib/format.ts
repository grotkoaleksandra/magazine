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

// "#Food, #warsaw  thebestof" → ["food", "warsaw", "thebestof"]
export function normalizeTags(input: string) {
  const tags = input
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+/, "").replace(/[^\p{L}\p{N}_-]/gu, ""))
    .filter(Boolean);
  return [...new Set(tags)].slice(0, 5);
}
