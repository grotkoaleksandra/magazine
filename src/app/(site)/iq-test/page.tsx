"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Question = { q: string; answers: [string, number][] };

// Points are meaningless. That is the point.
const QUESTIONS: Question[] = [
  { q: "A train leaves at 9:00 going 80 km/h. What colour is the driver's hat?", answers: [["Blue", 20], ["80", 10], ["Trains don't wear hats", 45], ["I am the train", 60]] },
  { q: "Which is heavier: a kilo of feathers or a kilo of bricks?", answers: [["Bricks", 0], ["Feathers", 20], ["They weigh the same", 30], ["Emotionally, the feathers", 55]] },
  { q: "You overtake the person in second place. What place are you in now?", answers: [["First", 5], ["Second", 30], ["Last, I was running the wrong way", 45], ["Races are a social construct", 55]] },
  { q: "How many holes does a straw have?", answers: [["One", 25], ["Two", 25], ["None, it's a tube", 40], ["I don't drink, I absorb", 55]] },
  { q: "Pick the odd one out: apple, banana, Tuesday, cherry.", answers: [["Tuesday", 20], ["Banana", 35], ["Apple", 30], ["Me", 55]] },
  { q: "You find a door that says \u201cDo not open\u201d. You:", answers: [["Don't open it", 5], ["Open it", 30], ["Knock politely and wait", 40], ["Become the door", 60]] },
  { q: "What comes next: 2, 4, 8, \u2026?", answers: [["16", 10], ["9", 30], ["A small dog", 50], ["Lunch", 45]] },
  { q: "How many months have 28 days?", answers: [["One", 10], ["All of them", 30], ["Depends on the moon's mood", 45], ["I refuse to count", 55]] },
];

const RESULTS: { min: number; iq: string; title: string; text: string }[] = [
  { min: 380, iq: "\u221e", title: "Galaxy Brain", text: "Scientists would like your brain in a jar. Politely decline and walk away slowly." },
  { min: 300, iq: "404", title: "Genius Not Found", text: "Our instruments broke trying to measure you. An engineer is on the way. He looks nervous." },
  { min: 220, iq: "141", title: "Suspiciously Clever", text: "Smart enough to be dangerous, silly enough to be fun. Stay exactly like this." },
  { min: 140, iq: "88", title: "Perfectly Average Goblin", text: "Solid instincts, questionable logic. You would survive the apocalypse entirely by accident." },
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
            {progress < 30 ? "locating brain…" : progress < 60 ? "brain located (small)" : progress < 90 ? "consulting a magic 8-ball…" : "rounding up generously…"}
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
