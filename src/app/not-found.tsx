import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container empty">
      <h1>Page not found</h1>
      <p>
        <Link href="/">Back to the front page</Link>
      </p>
    </main>
  );
}
