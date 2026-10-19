import { Fragment } from "react";
import { site } from "@/lib/site";

// BÜRN YER B☺ATS — caps, an umlaut on the U and a little :) living inside the O.
export const WORDMARK = ["B", "Ü", "R", "N", " ", "Y", "E", "R", " ", "B", "O:)", "A", "T", "S"];

// Grouped into words so it only ever wraps between words, never mid-word.
const WORDS = WORDMARK.join("|").split("| |").map((w) => w.split("|"));

export function WordmarkChar({ ch }: { ch: string }) {
  if (ch === "O:)") {
    return (
      <span className="ch-o">
        O
        <svg className="face" viewBox="0 0 26 32" aria-hidden>
          <circle cx="7.5" cy="10" r="3" />
          <circle cx="18.5" cy="10" r="3" />
          <path d="M5 19.5 Q13 28 21 19.5" />
        </svg>
      </span>
    );
  }
  return <>{ch}</>;
}

export function Wordmark() {
  return (
    <span aria-label={site.name} role="img" className="wordmark-text">
      {WORDS.map((word, w) => (
        <Fragment key={w}>
          <span className="wm-word">
            {word.map((ch, i) => (
              <WordmarkChar key={i} ch={ch} />
            ))}
          </span>
          {/* The space sits outside the word so the line can break here. */}
          {w < WORDS.length - 1 && " "}
        </Fragment>
      ))}
    </span>
  );
}
