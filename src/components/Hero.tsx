"use client";

import { useEffect, useRef, useState } from "react";
import { AccountNav } from "@/components/AccountNav";
import { Today } from "@/components/SiteHeader";
import { basePath, site } from "@/lib/site";

type Phase = "typing" | "typed" | "settled";

const SEEN_KEY = "byb-intro-seen";
const TYPE_MS = 95;

// Built-in punk montage (free Pexels clips in public/hero), used until an admin uploads a video.
const MONTAGE = [1, 2, 3, 4, 5, 6].map((n) => `${basePath}/hero/punk-${n}.mp4`);
const CUT_MIN_MS = 700;
const CUT_MAX_MS = 1300;

// Full-screen front-page hero. On the first visit of a session the title types
// itself out in the centre; once the page has loaded it glides to the bottom.
// The text inverts against the video behind it, pixel by pixel (mix-blend-mode: difference).
export function Hero({ videoUrl, ready }: { videoUrl?: string; ready: boolean }) {
  const text = site.name.toLowerCase();
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [cuts, setCuts] = useState(0);

  const sources = videoUrl ? [videoUrl] : MONTAGE;
  const montage = !videoUrl;

  // Type the title, or skip straight to the end for repeat visits / reduced motion.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      const t = setTimeout(() => {
        setCount(text.length);
        setPhase("settled");
      }, 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        clearInterval(timer);
        setPhase((p) => (p === "typing" ? "typed" : p));
      }
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [text]);

  // Settle once typing is done and the page content has loaded (or after a fallback wait).
  useEffect(() => {
    if (phase !== "typed") return;
    const t = setTimeout(
      () => {
        setPhase("settled");
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {}
      },
      ready ? 450 : 2500,
    );
    return () => clearTimeout(t);
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

  const settled = phase === "settled";

  return (
    <section className={`hero ${settled ? "is-settled" : ""} ${montage ? "hero-montage" : ""}`}>
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

      {/* Hollow outline rows of the name, drifting choppily like a lagging feed. */}
      <div className="hero-outlines" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <div key={r} className={`outline-row ${r % 2 ? "rev" : ""}`}>
            <span>{`${text} · `.repeat(6)}</span>
          </div>
        ))}
      </div>

      <p className="hero-caption" aria-hidden={!settled}>
        <span>{site.tagline.toLowerCase()}</span>
        <span className="hero-rule" />
        <span>issue nº 01</span>
      </p>
      <div className="hero-curtain" aria-hidden />

      <div className="hero-bar">
        <Today />
        <AccountNav />
      </div>

      <h1 className="hero-title" aria-label={site.name}>
        {Array.from(text).map((ch, i) => (
          <span key={i} aria-hidden className={i < count ? "ch on" : "ch"}>
            {i === count && !settled && <span className="caret" />}
            {ch}
          </span>
        ))}
        {count >= text.length && !settled && <span className="caret" />}
      </h1>
    </section>
  );
}
