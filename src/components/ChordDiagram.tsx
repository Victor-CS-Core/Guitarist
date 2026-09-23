import { useState } from "react";
import { chords } from "../curriculum/chords";
export function ChordDiagram({
  chordId,
  compact = false,
}: {
  chordId: string;
  compact?: boolean;
}) {
  const chord = chords[chordId],
    [selected, setSelected] = useState<number | null>(null);
  if (!chord) return null;
  return (
    <div className={`chord-diagram ${compact ? "compact" : ""}`}>
      <div className="chord-name">
        {chordId}
        <span>{chord.name}</span>
      </div>
      <svg
        viewBox="0 0 180 190"
        role="img"
        aria-label={`${chord.name} chord diagram`}
      >
        <line
          x1="25"
          y1="36"
          x2="155"
          y2="36"
          stroke="currentColor"
          strokeWidth="5"
        />
        {[1, 2, 3, 4].map((n) => (
          <line
            key={n}
            x1="25"
            y1={36 + n * 31}
            x2="155"
            y2={36 + n * 31}
            stroke="currentColor"
            opacity=".22"
          />
        ))}
        {chord.frets.map((fret, i) => (
          <g key={i}>
            <line
              x1={25 + i * 26}
              x2={25 + i * 26}
              y1="36"
              y2="160"
              stroke="currentColor"
              strokeWidth={1.4 - i * 0.13}
            />
            {fret <= 0 ? (
              <text x={25 + i * 26} y="23" textAnchor="middle" fontSize="15">
                {fret === -1 ? "×" : "○"}
              </text>
            ) : (
              <>
                <circle
                  cx={25 + i * 26}
                  cy={36 + (fret - 0.5) * 31}
                  r="11"
                  fill="#8a5a36"
                />
                <text
                  x={25 + i * 26}
                  y={40 + (fret - 0.5) * 31}
                  fill="white"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {chord.fingers[i]}
                </text>
              </>
            )}
            <text
              x={25 + i * 26}
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
            {chord.frets.map((fret, i) => (
              <button
                key={i}
                aria-label={`String ${6 - i}: ${fret < 0 ? "do not play" : fret === 0 ? "open" : `fret ${fret}, finger ${chord.fingers[i]}`}`}
                onClick={() => setSelected(i)}
              >
                {6 - i}
              </button>
            ))}
          </div>
          <p className="small">
            {selected === null
              ? "Tap a string number to explore the shape."
              : `String ${6 - selected}: ${chord.frets[selected] < 0 ? "keep this string quiet" : chord.frets[selected] === 0 ? "play open, no finger needed" : `fret ${chord.frets[selected]}, finger ${chord.fingers[selected]}`}.`}
          </p>
        </>
      )}
    </div>
  );
}
