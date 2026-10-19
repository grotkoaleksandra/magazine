"use client";

import { useEffect, useRef, useState } from "react";
import { AccountNav } from "@/components/AccountNav";
import { Today } from "@/components/SiteHeader";
import { basePath, site } from "@/lib/site";
import { WORDMARK, WordmarkChar } from "@/components/Wordmark";

// typing → typed (caret blinks) → panning (name glides down on black) → revealed (video and the rest fade in)
type Phase = "typing" | "typed" | "panning" | "revealed";

const TYPE_MIN_MS = 130;
const TYPE_MAX_MS = 230;
const HOLD_MS = 1300;
const PAN_MS = 1700;

// Plays on every full page load; skipped when navigating back to the front page within the site.
let introPlayed = false;

// Built-in punk montage (free Pexels clips in public/hero), used until an admin uploads a video.
const MONTAGE = [1, 2, 3, 4, 5, 6].map((n) => `${basePath}/hero/punk-${n}.mp4`);
const CUT_MIN_MS = 700;
const CUT_MAX_MS = 1300;

// Full-screen front-page hero. The name types itself out on black, pans down to the
// bottom, and then the video, caption and outline rows fade in around it.
// The text inverts against the video behind it, pixel by pixel (mix-blend-mode: difference).
export function Hero({ videoUrl, ready }: { videoUrl?: string; ready: boolean }) {
  const chars = WORDMARK;
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [cuts, setCuts] = useState(0);

  const sources = videoUrl ? [videoUrl] : MONTAGE;
  const montage = !videoUrl;

  // Type the title letter by letter, or skip straight to the end for in-site navigation / reduced motion.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (introPlayed || reduced) {
      const t = setTimeout(() => {
        setCount(chars.length);
        setPhase("revealed");
      }, 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const typeNext = () => {
      i += 1;
      setCount(i);
      if (i >= chars.length) setPhase("typed");
      // Uneven rhythm, with a longer beat after each space, like someone typing.
      else timer = setTimeout(typeNext, TYPE_MIN_MS + Math.random() * (TYPE_MAX_MS - TYPE_MIN_MS) + (chars[i - 1] === " " ? 160 : 0));
    };
    timer = setTimeout(typeNext, 600);
    return () => clearTimeout(timer);
  }, [chars]);

  // Hold with a blinking caret until the page has loaded, then pan down, then reveal.
  useEffect(() => {
    if (phase === "typed") {
      const t = setTimeout(() => setPhase("panning"), ready ? HOLD_MS : 3500);
      return () => clearTimeout(t);
    }
    if (phase === "panning") {
      const t = setTimeout(() => {
        setPhase("revealed");
        introPlayed = true;
      }, PAN_MS);
      return () => clearTimeout(t);
    }
  }, [phase, ready]);

  // Hard-cut between clips, jumping to a random moment in each. Clips load one at a time.
  useEffect(() => {
    if (!montage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const cut = () => {
      const videos = videoRefs.current;
      const pending = videos.find((v) => v && v.preload === "none");
      if (pending) {
        pending.preload = "auto";
        pending.load();
      }
      const ready = videos
        .map((v, i) => ({ v, i }))
        .filter(({ v, i }) => v && i !== activeRef.current && v.readyState >= 2 && v.duration > 2);
      if (ready.length) {
        const { v, i } = ready[Math.floor(Math.random() * ready.length)];
        v!.currentTime = Math.random() * (v!.duration - 1.5);
        v!.play().catch(() => {});
        videos[activeRef.current]?.pause();
        activeRef.current = i;
        setActive(i);
        setCuts((c) => c + 1);
        // Like a bad connection: now and then the picture freezes for a moment.
        if (Math.random() < 0.3) {
          setTimeout(() => v!.pause(), 120);
          setTimeout(() => v!.play().catch(() => {}), 120 + 90 + Math.random() * 260);
        }
      }
      timer = setTimeout(cut, CUT_MIN_MS + Math.random() * (CUT_MAX_MS - CUT_MIN_MS));
    };
    timer = setTimeout(cut, 1200);
    return () => clearTimeout(timer);
  }, [montage]);

  const settled = phase === "panning" || phase === "revealed";
  const revealed = phase === "revealed";

  return (
    <section className={`hero ${settled ? "is-settled" : ""} ${revealed ? "is-revealed" : ""} ${montage ? "hero-montage" : ""}`}>
      <div className="hero-fallback" />
      {sources.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            videoRefs.current[i] = el;
          }}
          className={`hero-video ${i === active ? "is-active" : ""}`}
          src={src}
          crossOrigin="anonymous"
          autoPlay={i === 0}
          muted
          loop
          playsInline
          preload={i < 2 ? "auto" : "none"}
        />
      ))}
      {montage && <div key={cuts} className="hero-flash" aria-hidden />}
      <div className="hero-grain" aria-hidden />
      <div className="hero-tracking" aria-hidden />

      {/* Faint thin rows of the name, drifting choppily like a lagging feed. */}
      <div className="hero-outlines" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <div key={r} className={`outline-row ${r % 2 ? "rev" : ""}`}>
            <span>{"BÜRN YER BOATS · ".repeat(6)}</span>
          </div>
        ))}
      </div>

      <div className="hero-curtain" aria-hidden />

      <div className="hero-bar">
        <Today />
        <AccountNav />
      </div>

      {/* Caption + wordmark move as one unit, so the rule always sits right above the word. */}
      <div className="hero-mark">
        <div className="hero-mark-inner">
          <p className="hero-caption" aria-hidden={!revealed}>
            <span>{site.tagline.toLowerCase()}</span>
            <span className="hero-rule" />
            <span>issue nº 01</span>
          </p>
          <h1 className="hero-title" aria-label={site.name}>
            {chars.map((ch, i) => (
              <span key={i} aria-hidden className={i < count ? "ch on" : "ch"}>
                {i === count && !revealed && <span className="caret" />}
                <WordmarkChar ch={ch} />
              </span>
            ))}
            {count >= chars.length && !revealed && <span className="caret" />}
          </h1>
        </div>
      </div>
    </section>
  );
}
