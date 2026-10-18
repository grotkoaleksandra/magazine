"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Today } from "@/components/SiteHeader";
import { site } from "@/lib/site";

type Phase = "typing" | "typed" | "settled";
type Tone = "light" | "dark";

const SEEN_KEY = "byb-intro-seen";
const TYPE_MS = 95;

// Full-screen front-page hero. On the first visit of a session the title types
// itself out in the centre; once the page has loaded it glides to the bottom.
// The text colour follows the brightness of the video behind it.
export function Hero({ videoUrl, ready }: { videoUrl?: string; ready: boolean }) {
  const text = site.name;
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [tone, setTone] = useState<Tone>("light");
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Sample the video behind the title and pick light or dark text.
  useEffect(() => {
    if (phase !== "settled" || !videoUrl) return;
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 12;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let failed = false;

    const sample = () => {
      const video = videoRef.current;
      const hero = heroRef.current;
      const title = titleRef.current;
      if (!ctx || failed || !video || !hero || !title || video.readyState < 2 || !video.videoWidth) return;

      // Map the title's on-screen box into video pixels (the video uses object-fit: cover).
      const h = hero.getBoundingClientRect();
      const r = title.getBoundingClientRect();
      const scale = Math.max(h.width / video.videoWidth, h.height / video.videoHeight);
      const offsetX = (h.width - video.videoWidth * scale) / 2;
      const offsetY = (h.height - video.videoHeight * scale) / 2;
      const sx = Math.max(0, (r.left - h.left - offsetX) / scale);
      const sy = Math.max(0, (r.top - h.top - offsetY) / scale);
      const sw = Math.min(video.videoWidth - sx, r.width / scale);
      const sh = Math.min(video.videoHeight - sy, r.height / scale);
      if (sw <= 0 || sh <= 0) return;

      try {
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        const luminance = sum / (data.length / 4) / 255;
        // A little hysteresis so the colour doesn't flicker around the midpoint.
        setTone((current) => (current === "light" ? (luminance > 0.6 ? "dark" : "light") : luminance < 0.48 ? "light" : "dark"));
      } catch {
        failed = true; // video host didn't allow reading pixels; keep light text with a shadow
      }
    };

    sample();
    const timer = setInterval(sample, 300);
    return () => clearInterval(timer);
  }, [phase, videoUrl]);

  const settled = phase === "settled";

  return (
    <section ref={heroRef} className={`hero hero-${settled ? tone : "light"} ${settled ? "is-settled" : ""}`}>
      {videoUrl ? (
        <video
          ref={videoRef}
          className="hero-video"
          src={videoUrl}
          crossOrigin="anonymous"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        <div className="hero-fallback" />
      )}
      <div className="hero-curtain" aria-hidden />

      <div className="hero-bar">
        <Today />
        <Link href="/admin/">Log in or join</Link>
      </div>

      <h1 ref={titleRef} className="hero-title" aria-label={text}>
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
