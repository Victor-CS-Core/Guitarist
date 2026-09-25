import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChordDiagram } from "./ChordDiagram";
import { barreRuns } from "./chordGeometry";
import { chords } from "../curriculum/chords";

// Diagram geometry in ChordDiagram: strings run from y=36 (top line) to y=160.
const TOP = 36;
const BOTTOM = 160;

function allVoicings() {
  const list: Array<{ id: string; index: number }> = [];
  for (const [id, chord] of Object.entries(chords))
    chord.voicings.forEach((_, index) => list.push({ id, index }));
  return list;
}

describe("ChordDiagram rendering", () => {
  it("keeps every dot and barre inside the diagram for all 856 voicings", () => {
    const diagrams = allVoicings().map(({ id, index }) => (
      <ChordDiagram key={`${id}-${index}`} chordId={id} voicingIndex={index} compact />
    ));
    const { container } = render(<>{diagrams}</>);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThan(0);
    for (const circle of circles) {
      const cy = Number(circle.getAttribute("cy"));
      expect(cy).toBeGreaterThanOrEqual(TOP);
      expect(cy).toBeLessThanOrEqual(BOTTOM);
    }
    for (const rect of container.querySelectorAll("rect.barre")) {
      const y = Number(rect.getAttribute("y"));
      const h = Number(rect.getAttribute("height"));
      expect(y).toBeGreaterThanOrEqual(TOP - h / 2);
      expect(y + h).toBeLessThanOrEqual(BOTTOM);
    }
  });

  it("draws barres as bars, not floating dots (open F shape)", () => {
    const { container } = render(<ChordDiagram chordId="F" voicingIndex={0} compact />);
    const barres = container.querySelectorAll("rect.barre");
    expect(barres.length).toBe(1);
    // The barre covers strings 2 and 1 (x = 25 + i*26, half spacing each side).
    const barre = barres[0];
    expect(Number(barre.getAttribute("x"))).toBe(25 + 4 * 26 - 13);
    expect(Number(barre.getAttribute("width"))).toBe(2 * 26);
    expect(barre.nextElementSibling?.textContent).toBe("1");
  });

  it("draws a lone note on the barre fret centered on the top line", () => {
    // Find a voicing with a fingered note on baseFret that is not part of a barre.
    let target: { id: string; index: number } | null = null;
    for (const [id, chord] of Object.entries(chords)) {
      chord.voicings.forEach((v, index) => {
        if (target) return;
        const barred = new Set<number>();
        for (const run of barreRuns(v))
          for (let i = run.from; i <= run.to; i++) barred.add(i);
        const lone = v.frets.findIndex(
          (f, i) => f === v.baseFret && v.baseFret >= 1 && v.fingers[i] > 0 && !barred.has(i),
        );
        if (lone >= 0) target = { id, index };
      });
      if (target) break;
    }
    expect(target).not.toBeNull();
    const { container } = render(
      <ChordDiagram chordId={target!.id} voicingIndex={target!.index} compact />,
    );
    const cys = [...container.querySelectorAll("circle")].map((c) =>
      Number(c.getAttribute("cy")),
    );
    expect(cys).toContain(TOP);
    for (const cy of cys) {
      expect(cy).toBeGreaterThanOrEqual(TOP);
      expect(cy).toBeLessThanOrEqual(BOTTOM);
    }
  });

  it("notes mode shows pitches on the dots (open C shape)", () => {
    const { container } = render(
      <ChordDiagram chordId="C" voicingIndex={0} compact labelMode="notes" />,
    );
    const labels = [...container.querySelectorAll("circle")].map(
      (c) => c.nextElementSibling?.textContent,
    );
    // Fretted strings: 5th string fret 3 -> C, 4th string fret 2 -> E, 2nd string fret 1 -> C.
    expect(labels).toContain("C");
    expect(labels).toContain("E");
    expect(labels.every((t) => t !== "1" && t !== "2" && t !== "3")).toBe(true);
  });
});
