import { Link } from "react-router-dom";
import {
  AudioWaveform,
  BookOpen,
  ChevronRight,
  Drum,
  Timer,
  Wrench,
} from "lucide-react";

const TOOLS = [
  {
    to: "/tools/timer",
    icon: Timer,
    title: "Study timer",
    blurb:
      "Count down a 5–45 minute focus block or count up freely — a gentle chime marks the end.",
  },
  {
    to: "/tools/tuner",
    icon: AudioWaveform,
    title: "Chromatic tuner",
    blurb:
      "Hear your strings through the mic with a cents needle, or tune by ear with reference tones.",
  },
  {
    to: "/tools/rhythm",
    icon: Drum,
    title: "Rhythm lab",
    blurb:
      "A full metronome: 4/4 to 7/8, subdivisions, accent patterns, tap tempo, and count-in.",
  },
  {
    to: "/tools/chords",
    icon: BookOpen,
    title: "Chord library",
    blurb:
      "Searchable diagrams for every open chord, with finger numbers and string-by-string help.",
  },
];

export function ToolsHome() {
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">PRACTICE TOOLS</div>
        <h1>
          Tools <Wrench size={22} aria-hidden />
        </h1>
        <p>
          Little helpers for the spaces between lessons — tune up, set a
          timer, lock in the groove, or look up a chord. Open to everyone,
          teachers and students alike.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 16,
        }}
      >
        {TOOLS.map(({ to, icon: Icon, title, blurb }) => (
          <Link
            key={to}
            to={to}
            className="card"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--er-cream, #f6efe3)",
              }}
              aria-hidden
            >
              <Icon size={22} />
            </span>
            <h2 style={{ margin: 0, fontSize: 19 }}>{title}</h2>
            <p className="small" style={{ margin: 0, flex: 1 }}>
              {blurb}
            </p>
            <span className="text-link" style={{ alignSelf: "flex-start" }}>
              Open tool <ChevronRight size={14} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
