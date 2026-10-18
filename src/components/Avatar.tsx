export function Avatar({ name, url, size = 40 }: { name: string | null; url: string | null; size?: number }) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="avatar" src={url} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span className="avatar avatar-initials" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials}
    </span>
  );
}
