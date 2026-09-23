import type { Activity } from "../curriculum/types";
import { ChordDiagram } from "./ChordDiagram";
import { ArrowRight, Hand, Music2 } from "lucide-react";

/** Non-interactive previews inside activity links; lesson controls live on the practice page. */
export function ActivityPreview({ activity }: { activity: Activity }) {
  if (activity.kind === "builder") {
    return (
      <div className="activity-preview builder-preview" aria-hidden="true">
        <div className="preview-caption">
          <strong>{activity.chordId}</strong>
          <span>Can you build it?</span>
        </div>
        <div className="preview-puzzle">
          <svg viewBox="0 0 150 125">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <line
                key={`s${n}`}
                x1={20 + n * 22}
                x2={20 + n * 22}
                y1="15"
                y2="112"
                stroke="currentColor"
                opacity=".4"
              />
            ))}
            {[0, 1, 2, 3].map((n) => (
              <line
                key={`f${n}`}
                x1="20"
                x2="130"
                y1={15 + n * 32}
                y2={15 + n * 32}
                stroke="currentColor"
                strokeWidth={n === 0 ? 4 : 1}
                opacity={n === 0 ? 1 : 0.35}
              />
            ))}
            <circle
              cx="76"
              cy="63"
              r="18"
              fill="#f6ede0"
              stroke="#99744b"
              strokeDasharray="3 4"
            />
            <text
              x="76"
              y="69"
              textAnchor="middle"
              fill="#7e5934"
              fontSize="20"
            >
              ?
            </text>
          </svg>
          <div className="finger-tokens">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <small>Place your fingers</small>
          </div>
        </div>
      </div>
    );
  }
  if (activity.chordId)
    return (
      <div className="activity-preview chord-preview" aria-hidden="true">
        <div className="preview-caption">
          <span>
            {activity.kind === "transition" ? "Move with ease" : "Let it ring"}
          </span>
          <strong>
            {activity.kind === "transition" ? "Em → Am" : activity.chordId}
          </strong>
          <span>
            {activity.kind === "transition"
              ? "One shape at a time"
              : "Find your finger positions"}
          </span>
        </div>
        <ChordDiagram chordId={activity.chordId} compact />
      </div>
    );
  if (activity.kind === "strings")
    return (
      <div className="activity-preview strings-preview" aria-hidden="true">
        <div className="preview-caption">
          <strong>
            Six strings.
            <br />
            So many sounds.
          </strong>
        </div>
        <svg viewBox="0 0 145 130">
          {[6, 5, 4, 3, 2, 1].map((n, i) => (
            <g key={n}>
              <text x="8" y={17 + i * 21} fontSize="12" fill="currentColor">
                {n}
              </text>
              <line
                x1="29"
                x2="140"
                y1={13 + i * 21}
                y2={13 + i * 21}
                stroke="currentColor"
                strokeWidth={3.8 - i * 0.5}
              />
            </g>
          ))}
        </svg>
      </div>
    );
  if (activity.kind === "notes")
    return (
      <div className="activity-preview melody-preview" aria-hidden="true">
        <Music2 size={30} />
        <div>
          <span>Your first little melody</span>
          <strong>0 · 0 · 1 · 1 · 0</strong>
          <small>
            String 1 <ArrowRight size={13} /> Take it slowly
          </small>
        </div>
      </div>
    );
  if (activity.kind === "fingers")
    return (
      <div className="activity-preview melody-preview" aria-hidden="true">
        <Hand size={48} strokeWidth={1.3} />
        <div>
          <span>Meet your fretting hand</span>
          <strong>1 · 2 · 3 · 4</strong>
          <small>Every finger has a part to play</small>
        </div>
      </div>
    );
  return (
    <div className="activity-preview melody-preview" aria-hidden="true">
      <Music2 size={42} strokeWidth={1.3} />
      <div>
        <span>
          {activity.kind === "rhythm"
            ? "Feel the steady pulse"
            : "Get to know your instrument"}
        </span>
        <strong>
          {activity.kind === "rhythm" ? "1 · 2 · 3 · 4" : "Hello, guitar."}
        </strong>
      </div>
    </div>
  );
}
