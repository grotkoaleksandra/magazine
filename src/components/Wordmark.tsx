import { site } from "@/lib/site";

// BÜRN YER B☺ATS — caps, an umlaut on the U and a little :) living inside the O.
export const WORDMARK = ["B", "Ü", "R", "N", " ", "Y", "E", "R", " ", "B", "O:)", "A", "T", "S"];

// Grouped into words so it only ever wraps between words, never mid-word.
const WORDS = WORDMARK.join("|").split("| |").map((w) => w.split("|"));

export function WordmarkChar({ ch }: { ch: string }) {
  if (ch === "O:)") {
    return (
      <span className="ch-o">
        O<span className="smile">:)</span>
      </span>
    );
  }
  return <>{ch}</>;
}

export function Wordmark() {
  return (
    <span aria-label={site.name} role="img" className="wordmark-text">
      {WORDS.map((word, w) => (
        <span key={w} className="wm-word">
          {word.map((ch, i) => (
            <WordmarkChar key={i} ch={ch} />
          ))}
          {w < WORDS.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
