import Link from "next/link";

export function Tags({ tags, limit }: { tags: string[]; limit?: number }) {
  if (!tags?.length) return null;
  return (
    <ul className="tags">
      {tags.slice(0, limit).map((t) => (
        <li key={t}>
          <Link href={`/search/?tag=${encodeURIComponent(t)}`}>#{t}</Link>
        </li>
      ))}
    </ul>
  );
}
