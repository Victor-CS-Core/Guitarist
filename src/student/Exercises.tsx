import { useState } from "react";
import type { Activity } from "../curriculum/types";
import { chords } from "../curriculum/chords";
import { ChordDiagram } from "../components/ChordDiagram";
export function Exercises({ activity }: { activity: Activity }) {
  const [round, setRound] = useState(0),
    [feedback, setFeedback] = useState(""),
    [placements, setPlacements] = useState<Record<number, number>>({}),
    [guide, setGuide] = useState(false);
  const quizzes = {
    parts: {
      prompts: [
        "Where do the strings attach to the body?",
        "Which part holds the tuning pegs?",
        "What separates the numbered spaces on the neck?",
      ],
      answers: ["Bridge", "Headstock", "Frets"],
      choices: [
        "Body",
        "Neck",
        "Headstock",
        "Tuning pegs",
        "Frets",
        "Fretboard",
        "Nut",
        "Bridge",
        "Sound hole",
      ],
      help: "On an electric guitar, pickups sense the strings instead of a sound hole amplifying them.",
    },
    fingers: {
      prompts: [
        "Which finger is number 3?",
        "Which finger is number 1?",
        "Which finger is number 4?",
      ],
      answers: ["Ring", "Index", "Pinky"],
      choices: ["Index", "Middle", "Ring", "Pinky", "Thumb"],
      help: "Your thumb supports the hand. It is not one of the four numbered fretting fingers.",
    },
    strings: {
      prompts: [
        "Find string 2.",
        "Find the thinnest string.",
        "Find the thickest string.",
      ],
      answers: [1, 0, 5],
      help: "Look at the string positions in playing position. The thickest string is closest to your face; the thinnest is closest to the floor.",
    },
  };
  const quiz =
    activity.kind === "parts"
      ? quizzes.parts
      : activity.kind === "fingers"
        ? quizzes.fingers
        : activity.kind === "strings"
          ? quizzes.strings
          : null;
  if (quiz) {
    const choices: Array<string | number> =
      activity.kind === "strings" ? [6, 5, 4, 3, 2, 1] : (quiz as { choices: string[] }).choices;
    return (
      <section className="exercise">
        <span className="eyebrow green">TRY IT · ROUND {round + 1}</span>
        <h3>{quiz.prompts[round % 3]}</h3>
        <div
          className={`choice-grid ${activity.kind === "strings" ? "string-choices" : ""}`}
        >
          {choices.map((choice: string | number, i: number) => (
            <button
              className="choice"
              key={choice}
              aria-label={activity.kind === "strings" ? `String position ${choice}` : undefined}
              onClick={() =>
                setFeedback(
                  activity.kind === "strings"
                    ? i === (quiz.answers as number[])[round % 3]
                      ? `You found it! This is string ${choice}. Now find it on your guitar.`
                      : "Almost there. Compare the thickness and position, then try again."
                    : choice === (quiz.answers as string[])[round % 3]
                      ? "You found it! Try finding it on your guitar, too."
                      : "Almost there. Take another look and try again.",
                )
              }
            >
              <span>{activity.kind === "strings" ? "" : choice}</span>
              {activity.kind === "strings" && (
                <span
                  className="string-line"
                  style={{ height: Math.max(1, 5 - i * 0.7) }}
                />
              )}
            </button>
          ))}
        </div>
        <p className="small">{quiz.help}</p>
        <div role="status" className="exercise-feedback">
          {feedback}
        </div>
        {feedback.startsWith("You found") && (
          <button
            className="button secondary"
            onClick={() => {
              setRound((r) => r + 1);
              setFeedback("");
            }}
          >
            Try another
          </button>
        )}
      </section>
    );
  }
  if (activity.kind === "builder") {
    const chord = chords[activity.chordId ?? "Am"];
    return (
      <section className="exercise">
        <h3>Build {activity.chordId} one finger at a time</h3>
        <p>
          Choose a fret on each string that needs a finger. Open strings stay
          empty.
        </p>
        <button className="text-link" onClick={() => setGuide(!guide)}>
          {guide ? "Hide" : "Show"} the guide
        </button>
        {guide && <ChordDiagram chordId={activity.chordId ?? "Am"} />}
        <div className="builder-grid">
          <span>Fret</span>
          {[6, 5, 4, 3, 2, 1].map((n) => (
            <strong key={n}>S{n}</strong>
          ))}
          {[1, 2, 3].map((f) => (
            <div className="builder-row" key={f}>
              <span>{f}</span>
              {[6, 5, 4, 3, 2, 1].map((n) => (
                <button
                  key={n}
                  aria-label={`String ${n}, fret ${f}`}
                  aria-pressed={placements[n] === f}
                  onClick={() => {
                    setPlacements((p) => ({ ...p, [n]: p[n] === f ? 0 : f }));
                    setFeedback("");
                  }}
                >
                  {placements[n] === f ? "●" : "·"}
                </button>
              ))}
            </div>
          ))}
        </div>
        <button
          className="button"
          onClick={() =>
            setFeedback(
              chord.frets.every((f, i) =>
                f > 0 ? placements[6 - i] === f : !placements[6 - i],
              )
                ? "That’s the shape! Now build it on your guitar. Your teacher will check how it sounds."
                : "Keep exploring. Check each string against the guide and try again.",
            )
          }
        >
          Check my shape
        </button>
        <div role="status" className="exercise-feedback">
          {feedback}
        </div>
      </section>
    );
  }
  return (
    <div className="exercise">
      {activity.chordId && <ChordDiagram chordId={activity.chordId} />}
      <h3>
        {activity.kind === "rhythm"
          ? "D  D  D  D"
          : activity.kind === "transition"
            ? "Em → Am → Em"
            : activity.kind === "notes"
              ? "Slow is a lovely place to start."
              : "Let every string ring."}
      </h3>
      <p>
        {activity.kind === "rhythm"
          ? "Count 1 — 2 — 3 — 4. Let the beat guide your hand."
          : activity.kind === "notes"
            ? "Try 0 — 0 — 1 — 1 — 0 on string 1. A small melody is still music."
            : "Try the shape on your guitar. Listen, adjust, and try again."}
      </p>
    </div>
  );
}
