// The site's whole tag vocabulary: six broad tags, enforced in the database too (migrations 005–006).
export const TAGS = ["events", "life", "ideas", "people", "places", "music"] as const;
export type Tag = (typeof TAGS)[number];
export const isTag = (t: string): t is Tag => (TAGS as readonly string[]).includes(t);
