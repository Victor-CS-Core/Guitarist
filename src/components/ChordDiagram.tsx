import { useState } from "react";
import { chords } from "../curriculum/chords";
import { barreRuns, stringNoteName } from "./chordGeometry";

const TOP_Y = 36;
const FRET_H = 31;
const STRING_X0 = 25;
const STRING_DX = 26;

export type ChordLabelMode = "fingers" | "notes";

export function ChordDiagram({
  chordId,
  compact = false,
  voicingIndex = 0,
  labelMode = "fingers",
}: {
  chordId: string;
  compact?: boolean;
  voicingIndex?: number;
  /** "notes" shows the sounding pitch on each dot instead of the finger number. */
  labelMode?: ChordLabelMode;
}) {
  const chord = chords[chordId],
    [selected, setSelected] = useState<number | null>(null);
  if (!chord) return null;
  const voicing = chord.voicings[voicingIndex] ?? chord.voicings[0];
  const frets = voicing.frets;
  const fingers = voicing.fingers;
  const baseFret = voicing.baseFret;
  const movable = baseFret >= 1;
  const runs = barreRuns(voicing);
  const barredStrings = new Set<number>();
  for (const run of runs)
    for (let i = run.from; i <= run.to; i++) barredStrings.add(i);
  // Dots sit in the middle of their fret space, relative to the shown window.
  // A note fretted exactly on the window's top line (the barre fret of a
  // movable shape) is drawn centered on that line — never above the diagram.
  const dotY = (fret: number) =>
    fret === baseFret ? TOP_Y : TOP_Y + (fret - baseFret - 0.5) * FRET_H;
  const dotLabel = (i: number) =>
    labelMode === "notes"
      ? (stringNoteName(i, frets[i]) ?? "")
      : String(fingers[i]);
  return (
    <div className={`chord-diagram ${compact ? "compact" : ""}`}>
      <div className="chord-name">
        {chordId}
        <span>{chord.name}</span>
      </div>
      <svg
        viewBox="0 0 180 190"
        role="img"
        aria-label={`${chord.name} chord diagram${movable ? `, ${voicing.label}` : ""}`}
      >
        {movable ? (
          <>
            <text
              x="32"
              y="23"
              fontSize="11"
              fontWeight="700"
              fill="currentColor"
              opacity=".8"
            >
              {baseFret}fr
            </text>
            {[0, 1, 2, 3, 4].map((n) => (
              <line
                key={n}
                x1="25"
                y1={TOP_Y + n * FRET_H}
                x2="155"
                y2={TOP_Y + n * FRET_H}
                stroke="currentColor"
                opacity={n === 0 ? ".9" : ".22"}
              />
            ))}
          </>
        ) : (
          <>
            <line
              x1="25"
              y1={TOP_Y}
              x2="155"
              y2={TOP_Y}
              stroke="currentColor"
              strokeWidth="5"
            />
            {[1, 2, 3, 4].map((n) => (
              <line
                key={n}
                x1="25"
                y1={TOP_Y + n * FRET_H}
                x2="155"
                y2={TOP_Y + n * FRET_H}
                stroke="currentColor"
                opacity=".22"
              />
            ))}
          </>
        )}
        {runs.map((run, r) => {
          const x1 = STRING_X0 + run.from * STRING_DX - STRING_DX / 2;
          const x2 = STRING_X0 + run.to * STRING_DX + STRING_DX / 2;
          const cy = dotY(run.fret);
          return (
            <g key={`barre-${r}`}>
              <rect
                className="barre"
                x={x1}
                y={cy - 10}
                width={x2 - x1}
                height="20"
                rx="10"
                fill="#8a5a36"
              />
              <text
                x={(x1 + x2) / 2}
                y={cy + 4}
                fill="white"
                fontSize="12"
                textAnchor="middle"
              >
                {run.finger}
              </text>
            </g>
          );
        })}
        {frets.map((fret, i) => (
          <g key={i}>
            <line
              x1={STRING_X0 + i * STRING_DX}
              x2={STRING_X0 + i * STRING_DX}
              y1={TOP_Y}
              y2="160"
              stroke="currentColor"
              strokeWidth={1.4 - i * 0.13}
            />
            {fret <= 0 ? (
              <text x={STRING_X0 + i * STRING_DX} y="23" textAnchor="middle" fontSize="15">
                {fret === -1 ? "×" : "○"}
              </text>
            ) : barredStrings.has(i) ? null : (
              <>
                <circle
                  cx={STRING_X0 + i * STRING_DX}
                  cy={dotY(fret)}
                  r="11"
                  fill="#8a5a36"
                />
                <text
                  x={STRING_X0 + i * STRING_DX}
                  y={dotY(fret) + 4}
                  fill="white"
                  fontSize={labelMode === "notes" && dotLabel(i).length > 1 ? 9 : labelMode === "notes" ? 11 : 12}
                  textAnchor="middle"
                >
                  {dotLabel(i)}
                </text>
              </>
            )}
            <text
              x={STRING_X0 + i * STRING_DX}
              y="180"
              textAnchor="middle"
              fontSize="10"
              fill="#88735e"
            >
              {6 - i}
            </text>
          </g>
        ))}
      </svg>
      {!compact && (
        <>
          <div className="string-details">
            {frets.map((fret, i) => (
              <button
                key={i}
                aria-label={`String ${6 - i}: ${fret < 0 ? "do not play" : fret === 0 ? "open" : `fret ${fret}, finger ${fingers[i]}`}`}
                onClick={() => setSelected(i)}
              >
                {6 - i}
              </button>
            ))}
          </div>
          <p className="small">
            {selected === null
              ? "Tap a string number to explore the shape."
              : `String ${6 - selected}: ${frets[selected] < 0 ? "keep this string quiet" : frets[selected] === 0 ? "play open, no finger needed" : `fret ${frets[selected]}, finger ${fingers[selected]}`}.`}
          </p>
        </>
      )}
    </div>
  );
}
