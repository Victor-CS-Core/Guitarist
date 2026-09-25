import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { ChordDiagram } from "../components/ChordDiagram";
import { chords } from "../curriculum/chords";

export function ChordLibraryPage() {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(chords).filter(([id, chord]) => {
      if (!q) return true;
      return (
        id.toLowerCase().includes(q) ||
        chord.name.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">PRACTICE TOOLS</div>
        <h1>Chord library</h1>
        <p>
          Every chord shape you need, with finger numbers on the dots. Search
          for a chord, tap a string number to explore it, and take it back to
          your practice.
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
        <p className="small">
          {matches.length} of {Object.keys(chords).length} chords
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
            Nothing matches “{query.trim()}” yet. Try a letter like G, C, or D
            — or clear the search to browse everything.
          </p>
          <button className="button secondary" onClick={() => setQuery("")}>
            Clear search
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
          {matches.map(([id]) => (
            <div className="card" key={id}>
              <ChordDiagram chordId={id} />
            </div>
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
          to string 1 (thinnest).
        </p>
      </section>
    </>
  );
}
