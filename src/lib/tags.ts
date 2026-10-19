// The site's whole tag vocabulary: five broad tags, enforced in the database too (migration 005).
export const TAGS = ["events", "life", "ideas", "people", "places"] as const;
export type Tag = (typeof TAGS)[number];
export const isTag = (t: string): t is Tag => (TAGS as readonly string[]).includes(t);
