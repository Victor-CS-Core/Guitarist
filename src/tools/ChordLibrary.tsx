import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { ChordDiagram } from "../components/ChordDiagram";
import { chords, type Chord } from "../curriculum/chords";

const ROOT_FILTERS: Array<{ key: string; label: string }> = [
  { key: "All", label: "All" },
  { key: "C", label: "C" },
  { key: "C#", label: "C♯" },
  { key: "D", label: "D" },
  { key: "Eb", label: "E♭" },
  { key: "E", label: "E" },
  { key: "F", label: "F" },
  { key: "F#", label: "F♯" },
  { key: "G", label: "G" },
  { key: "Ab", label: "A♭" },
  { key: "A", label: "A" },
  { key: "Bb", label: "B♭" },
  { key: "B", label: "B" },
];

const QUALITY_FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "", label: "Major" },
  { key: "m", label: "Minor" },
  { key: "7", label: "7" },
  { key: "maj7", label: "maj7" },
  { key: "m7", label: "m7" },
  { key: "dim", label: "dim" },
  { key: "dim7", label: "dim7" },
  { key: "m7b5", label: "m7♭5" },
  { key: "aug", label: "aug" },
  { key: "sus2", label: "sus2" },
  { key: "sus4", label: "sus4" },
  { key: "7sus4", label: "7sus4" },
  { key: "5", label: "5" },
  { key: "6", label: "6" },
  { key: "m6", label: "m6" },
  { key: "9", label: "9" },
  { key: "maj9", label: "maj9" },
  { key: "m9", label: "m9" },
  { key: "add9", label: "add9" },
  { key: "madd9", label: "madd9" },
  { key: "69", label: "6/9" },
  { key: "11", label: "11" },
  { key: "m11", label: "m11" },
  { key: "13", label: "13" },
];

function ChordCard({ id, chord }: { id: string; chord: Chord }) {
  const [voicing, setVoicing] = useState(0);
  return (
    <div className="card">
      {chord.voicings.length > 1 && (
        <div className="voicing-tabs" role="tablist" aria-label={`${chord.name} voicings`}>
          {chord.voicings.map((v, i) => (
            <button
              key={v.label}
              role="tab"
              aria-selected={voicing === i}
              className={voicing === i ? "active" : ""}
              onClick={() => setVoicing(i)}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      <ChordDiagram chordId={id} voicingIndex={voicing} />
      <p className="small chord-notes">{chord.notes.join(" · ")}</p>
    </div>
  );
}

export function ChordLibraryPage() {
  const [query, setQuery] = useState("");
  const [root, setRoot] = useState("All");
  const [quality, setQuality] = useState("all");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(chords).filter(([id, chord]) => {
      if (root !== "All" && chord.root !== root) return false;
      if (quality !== "all" && chord.quality !== quality) return false;
      if (!q) return true;
      return (
        id.toLowerCase().includes(q) ||
        chord.name.toLowerCase().includes(q) ||
        chord.notes.join(" ").toLowerCase().includes(q)
      );
    });
  }, [query, root, quality]);

  const total = Object.keys(chords).length;

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">PRACTICE TOOLS</div>
        <h1>Chord library</h1>
        <p>
          Every chord shape you need, with finger numbers on the dots. Filter
          by root or type, search for a chord, tap a string number to explore
          it, and take it back to your practice.
        </p>
      </div>

      <section className="card spaced">
        <label
          className="row"
          style={{ gap: 8, alignItems: "center", marginBottom: 4 }}
        >
          <Search size={16} aria-hidden />
          <input
            type="search"
            aria-label="Search chords by name"
            placeholder="Search chords — try “G” or “minor”…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", fontSize: 16 }}
          />
        </label>
        <div className="filter-group">
          <span className="filter-label" id="root-filter-label">
            Root
          </span>
          <div
            className="filter-chips"
            role="group"
            aria-labelledby="root-filter-label"
          >
            {ROOT_FILTERS.map((r) => (
              <button
                key={r.key}
                aria-pressed={root === r.key}
                className={root === r.key ? "active" : ""}
                onClick={() => setRoot(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label" id="type-filter-label">
            Type
          </span>
          <div
            className="filter-chips"
            role="group"
            aria-labelledby="type-filter-label"
          >
            {QUALITY_FILTERS.map((t) => (
              <button
                key={t.key}
                aria-pressed={quality === t.key}
                className={quality === t.key ? "active" : ""}
                onClick={() => setQuality(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <p className="small">
          {matches.length} of {total} chords
          {query.trim() && (
            <>
              {" "}
              matching “<strong>{query.trim()}</strong>”
            </>
          )}
          .
        </p>
      </section>

      {matches.length === 0 ? (
        <section className="empty">
          <BookOpen size={28} aria-hidden />
          <h2>No chords found</h2>
          <p>
            Nothing matches those filters yet. Try a different root or type —
            or clear the search to browse everything.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setQuery("");
              setRoot("All");
              setQuality("all");
            }}
          >
            Clear filters
          </button>
        </section>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: 16,
          }}
        >
          {matches.map(([id, chord]) => (
            <ChordCard key={id} id={id} chord={chord} />
          ))}
        </div>
      )}

      <section className="card spaced">
        <h2 className="section-heading" style={{ marginTop: 0 }}>
          Reading a diagram
        </h2>
        <p className="small">
          The thick line at the top is the nut. Circles are where your
          fingertips press, and the number inside is which finger to use: 1 is
          your index, 4 is your pinky. ○ means play the string open, × means
          keep it quiet. Diagrams read left to right from string 6 (thickest)
          to string 1 (thinnest). Shapes played higher up the neck show a fret
          badge like “5fr” instead of the nut — the four lines are frets 5
          through 8. The notes line under each diagram lists the chord tones
          from low to high.
        </p>
      </section>
    </>
  );
}
