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
const CUT_MIN_MS = 1100;
const CUT_MAX_MS = 2000;

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
  // Safari in Low Power Mode (and some autoplay settings) refuses to autoplay video.
  const [blocked, setBlocked] = useState(false);
  const blockedRef = useRef(false);

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

  // Detect blocked autoplay; if so, start playback on the first click, tap or key press.
  useEffect(() => {
    const first = videoRefs.current[0];
    if (!first) return;
    const markBlocked = () => {
      blockedRef.current = true;
      setBlocked(true);
    };
    const check = setTimeout(() => {
      first.play().catch(markBlocked);
      setTimeout(() => {
        if (first.paused) markBlocked();
      }, 600);
    }, 400);
    const resume = () => {
      const v = videoRefs.current[activeRef.current];
      v?.play()
        .then(() => {
          blockedRef.current = false;
          setBlocked(false);
        })
        .catch(() => {});
    };
    const events = ["pointerdown", "keydown", "touchend"] as const;
    events.forEach((e) => window.addEventListener(e, resume));
    return () => {
      clearTimeout(check);
      events.forEach((e) => window.removeEventListener(e, resume));
    };
  }, [sources.length]);

  // Hard-cut between clips, jumping to a random already-downloaded moment in each.
  // The next clip is cued and started while hidden; we only cut to it once it is
  // actually moving, so every cut lands on live footage instead of a frozen frame.
  useEffect(() => {
    if (!montage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    // A random start point inside what the browser has already buffered.
    const bufferedStart = (v: HTMLVideoElement) => {
      const ranges = [];
      for (let r = 0; r < v.buffered.length; r++) {
        const start = v.buffered.start(r);
        const end = v.buffered.end(r) - 1.5;
        if (end > start) ranges.push([start, end]);
      }
      if (!ranges.length) return null;
      const [start, end] = ranges[Math.floor(Math.random() * ranges.length)];
      return start + Math.random() * (end - start);
    };

    const scheduleNext = () => {
      if (!cancelled) timer = setTimeout(cut, CUT_MIN_MS + Math.random() * (CUT_MAX_MS - CUT_MIN_MS));
    };

    const cut = () => {
      const videos = videoRefs.current;
      // Without playback, cutting would just flip between still frames (a slideshow), so wait.
      if (blockedRef.current) return scheduleNext();
      if (videos[activeRef.current]?.paused && !document.hidden) {
        blockedRef.current = true;
        setBlocked(true);
        return scheduleNext();
      }
      // Keep loading the remaining clips in the background, one at a time.
      const pending = videos.find((v) => v && v.preload === "none");
      if (pending) {
        pending.preload = "auto";
        pending.load();
      }
      const candidates = videos
        .map((v, i) => ({ v, i, at: v ? bufferedStart(v) : null }))
        .filter(({ v, i, at }) => v && i !== activeRef.current && v.readyState >= 3 && at !== null);
      if (!candidates.length) return scheduleNext();

      const { v, i, at } = candidates[Math.floor(Math.random() * candidates.length)];
      const next = v!;
      let done = false;
      const swap = () => {
        if (done || cancelled) return;
        done = true;
        const prev = videos[activeRef.current];
        activeRef.current = i;
        setActive(i);
        setCuts((c) => c + 1);
        // Pause the old clip a beat later so the cut never shows a gap.
        setTimeout(() => prev?.pause(), 80);
        scheduleNext();
      };
      next.currentTime = at!;
      next.play().catch(() => {
        done = true; // refused to play: stay on the current clip
        blockedRef.current = true;
        setBlocked(true);
        scheduleNext();
      });
      // Cut as soon as the hidden clip renders a new frame (or after a short safety wait).
      const onTime = () => {
        if (next.currentTime > at! + 0.04) {
          next.removeEventListener("timeupdate", onTime);
          swap();
        }
      };
      next.addEventListener("timeupdate", onTime);
      setTimeout(() => {
        next.removeEventListener("timeupdate", onTime);
        if (!next.paused) swap();
        else if (!done) {
          done = true;
          scheduleNext();
        }
      }, 900);
    };

    timer = setTimeout(cut, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
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

      {blocked && revealed && (
        <button
          type="button"
          className="hero-play"
          onClick={() => videoRefs.current[activeRef.current]?.play().catch(() => {})}
        >
          ▶ tap to play
        </button>
      )}

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
