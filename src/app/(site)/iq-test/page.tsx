"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Question = { q: string; answers: [string, number][] };

// Points are meaningless. That is the point.
const QUESTIONS: Question[] = [
  { q: "Which sock colours are acceptable?", answers: [["Purple, blue and green. Uniqlo only.", 40], ["Black, like a normal person", 5], ["Red", -10], ["I don't wear socks, I wear vibes", 25]] },
  { q: "Is soup a drink?", answers: [["Yes", 10], ["No", 10], ["Only in a mug", 30], ["I am the soup", 50]] },
  { q: "How long does paint take to dry?", answers: [["About 40 minutes", 5], ["41 days", 30], ["Until you find yourself", 45], ["Paint never truly dries", 60]] },
  { q: "Ponchki the cyborg pug throws you a ball. You:", answers: [["Fetch it", 8], ["Calculate its trajectory and lie down", 50], ["Ask for a firmware update", 35], ["Bark", 20]] },
  { q: "What is 2 + 2?", answers: [["4", 3], ["22", 25], ["Fish", 40], ["Depends on the khachapuri", 55]] },
  { q: "How many spoons does a kitchen need?", answers: [["Two. The rest are decorative cutlery.", 45], ["Thirteen", 10], ["Zero, I drink everything (see question 2)", 30], ["One, if it feels like a handshake", 50]] },
  { q: "What belongs at track seven of every playlist?", answers: [["ABBA", 50], ["Silence", 15], ["A field recording of a pigeon union meeting", 35], ["ABBA, again", 60]] },
  { q: "It's 3 a.m. in a Żabka. You buy:", answers: [["A hot dog", 20], ["Nothing. You just stand there.", 35], ["41 tins of eggshell white", 50], ["Enlightenment", 45]] },
];

const RESULTS: { min: number; iq: string; title: string; text: string }[] = [
  { min: 380, iq: "∞", title: "Certified Sock Philosopher", text: "Your brain is purple, blue and green. Michael Karnow has been notified and is very proud of you." },
  { min: 300, iq: "404", title: "Genius Not Found", text: "Our instruments broke trying to measure you. Ponchki has filed an incident report." },
  { min: 220, iq: "141", title: "Drying Nicely", text: "You are touch-dry but not fully cured. Sit with yourself for another three to five business days." },
  { min: 140, iq: "88", title: "Pigeon Union Delegate", text: "Solid instincts, strong opinions about breadcrumbs. Not stupid, just extremely Warsaw." },
  { min: -100, iq: "12", title: "Normal Person", text: "You answered sensibly. Frankly, that is the most worrying result of all. Please take the test again." },
];

export default function IqTestPage() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const done = step >= QUESTIONS.length;
  const result = RESULTS.find((r) => score >= r.min)!;

  // A fake, laggy brain scan before revealing the result.
  useEffect(() => {
    if (!scanning) return;
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + Math.random() * 18);
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => setScanning(false), 400);
      }
    }, 220);
    return () => clearInterval(t);
  }, [scanning]);

  function answer(points: number) {
    setScore((s) => s + points);
    const next = step + 1;
    setStep(next);
    if (next >= QUESTIONS.length) {
      setProgress(0);
      setScanning(true);
    }
  }

  function restart() {
    setStep(0);
    setScore(0);
    setProgress(0);
    setScanning(false);
  }

  return (
    <div className="iq">
      <p className="iq-kicker">official* burn yer boats intelligence assessment</p>
      <h1 className="page-heading">are you stupid?</h1>

      {!done && (
        <div className="iq-card">
          <div className="iq-progress" aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}>
            {QUESTIONS.map((_, i) => (
              <span key={i} className={i < step ? "on" : i === step ? "now" : ""} />
            ))}
          </div>
          <p className="iq-count">
            question {step + 1} / {QUESTIONS.length}
          </p>
          <h2 className="iq-question">{QUESTIONS[step].q}</h2>
          <div className="iq-answers">
            {QUESTIONS[step].answers.map(([label, points], i) => (
              <button key={label} type="button" className="iq-answer" onClick={() => answer(points)}>
                <span className="iq-letter">{"ABCD"[i]}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {done && scanning && (
        <div className="iq-card iq-scan">
          <p className="iq-count">scanning your brain…</p>
          <div className="iq-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="iq-scan-log">
            {progress < 30 ? "locating brain…" : progress < 60 ? "brain located (small)" : progress < 90 ? "consulting ponchki…" : "applying sock correction…"}
          </p>
        </div>
      )}

      {done && !scanning && (
        <div className="iq-card iq-result">
          <p className="iq-count">your iq is</p>
          <p className="iq-score">{result.iq}</p>
          <h2 className="iq-question">{result.title}</h2>
          <p className="iq-text">{result.text}</p>
          <div className="iq-actions">
            <button type="button" className="btn btn-primary" onClick={restart}>
              Take it again
            </button>
            <Link href="/" className="btn">
              Back to the magazine
            </Link>
          </div>
        </div>
      )}

      <p className="iq-fine">*not official. not a test. not even a little bit scientific.</p>
    </div>
  );
}
